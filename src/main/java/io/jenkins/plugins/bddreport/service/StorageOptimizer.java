package io.jenkins.plugins.bddreport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jenkins.plugins.bddreport.model.Attachment;
import io.jenkins.plugins.bddreport.model.CucumberReportPayload;
import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.model.HookResult;
import io.jenkins.plugins.bddreport.model.ReportSummary;
import io.jenkins.plugins.bddreport.model.ScenarioResult;
import io.jenkins.plugins.bddreport.model.StepResult;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.io.IOUtils;

/**
 * Core engine responsible for storage optimization:
 * 1. GZIP compression on the fly into build.getRootDir()/cucumber-report.json.gz
 * 2. Pruning & externalizing large text/binary attachments to fragment files
 * 3. Calculating summary stats and structuring the lightweight report payload.
 */
public class StorageOptimizer {

    private static final Logger LOGGER = Logger.getLogger(StorageOptimizer.class.getName());
    public static final String REPORT_GZ_FILENAME = "cucumber-report.json.gz";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final File buildRootDir;
    private final boolean embedFullAttachments;
    private final int attachmentThresholdKB;
    private final AttachmentExternalizer externalizer;

    public StorageOptimizer(File buildRootDir, boolean embedFullAttachments, int attachmentThresholdKB) {
        this.buildRootDir = buildRootDir;
        this.embedFullAttachments = embedFullAttachments;
        this.attachmentThresholdKB = attachmentThresholdKB > 0 ? attachmentThresholdKB : 500;
        this.externalizer = new AttachmentExternalizer(buildRootDir);
    }

    /**
     * Optimizes, summarizes, and compresses parsed features into cucumber-report.json.gz.
     *
     * @param features List of parsed feature results
     * @param buildDisplayName Name of the current Jenkins build
     * @param buildUrl Relative URL of the build
     * @return Processed report payload
     * @throws IOException If disk write or compression fails
     */
    public CucumberReportPayload optimizeAndSave(List<FeatureResult> features, String buildDisplayName, String buildUrl) throws IOException {
        long thresholdBytes = (long) attachmentThresholdKB * 1024L;

        ReportSummary summary = new ReportSummary();
        int totalScenarios = 0;
        int passedScenarios = 0;
        int failedScenarios = 0;
        int skippedScenarios = 0;

        int totalSteps = 0;
        int passedSteps = 0;
        int failedSteps = 0;
        int skippedSteps = 0;

        int totalPassedFeatures = 0;
        int totalFailedFeatures = 0;
        int totalSkippedFeatures = 0;

        long totalDurationNanos = 0;
        int totalAttachmentsCount = 0;
        Set<String> uniqueTags = new HashSet<>();

        // Process attachments and compute aggregates
        for (FeatureResult feature : features) {
            uniqueTags.addAll(feature.getTags());
            totalDurationNanos += feature.getDuration();

            String fStatus = feature.getStatus();
            if ("failed".equalsIgnoreCase(fStatus)) {
                totalFailedFeatures++;
            } else if ("skipped".equalsIgnoreCase(fStatus)) {
                totalSkippedFeatures++;
            } else {
                totalPassedFeatures++;
            }

            for (ScenarioResult scenario : feature.getScenarios()) {
                uniqueTags.addAll(scenario.getTags());
                totalScenarios++;

                String sStatus = scenario.getStatus();
                if ("failed".equalsIgnoreCase(sStatus)) {
                    failedScenarios++;
                } else if ("skipped".equalsIgnoreCase(sStatus)) {
                    skippedScenarios++;
                } else {
                    passedScenarios++;
                }

                // Process Before Hook Attachments
                for (HookResult hook : scenario.getBeforeHooks()) {
                    totalAttachmentsCount += processAttachments(hook.getAttachments(), thresholdBytes);
                }

                // Process Steps & Attachments
                for (StepResult step : scenario.getSteps()) {
                    totalSteps++;
                    String stepStatus = step.getStatus();
                    if ("failed".equalsIgnoreCase(stepStatus)) {
                        failedSteps++;
                    } else if ("skipped".equalsIgnoreCase(stepStatus) || "pending".equalsIgnoreCase(stepStatus) || "undefined".equalsIgnoreCase(stepStatus)) {
                        skippedSteps++;
                    } else {
                        passedSteps++;
                    }

                    totalAttachmentsCount += processAttachments(step.getAttachments(), thresholdBytes);
                }

                // Process After Hook Attachments
                for (HookResult hook : scenario.getAfterHooks()) {
                    totalAttachmentsCount += processAttachments(hook.getAttachments(), thresholdBytes);
                }
            }
        }

        // Finalize Summary
        summary.setTotalFeatures(features.size());
        summary.setPassedFeatures(totalPassedFeatures);
        summary.setFailedFeatures(totalFailedFeatures);
        summary.setSkippedFeatures(totalSkippedFeatures);

        summary.setTotalScenarios(totalScenarios);
        summary.setPassedScenarios(passedScenarios);
        summary.setFailedScenarios(failedScenarios);
        summary.setSkippedScenarios(skippedScenarios);

        summary.setTotalSteps(totalSteps);
        summary.setPassedSteps(passedSteps);
        summary.setFailedSteps(failedSteps);
        summary.setSkippedSteps(skippedSteps);

        summary.setTotalDuration(totalDurationNanos);
        summary.setTotalAttachments(totalAttachmentsCount);

        List<String> sortedTags = new ArrayList<>(uniqueTags);
        Collections.sort(sortedTags);
        summary.setAllTags(sortedTags);

        // Build Payload
        CucumberReportPayload payload = new CucumberReportPayload();
        payload.setSummary(summary);
        payload.setFeatures(features);
        payload.setEmbedFullAttachments(embedFullAttachments);
        payload.setAttachmentThresholdKB(attachmentThresholdKB);
        payload.setBuildDisplayName(buildDisplayName);
        payload.setBuildUrl(buildUrl);

        // Serialize and compress directly to disk
        savePayloadToGzip(payload);

        return payload;
    }

    private int processAttachments(List<Attachment> attachments, long thresholdBytes) {
        if (attachments == null || attachments.isEmpty()) {
            return 0;
        }

        for (Attachment att : attachments) {
            String data = att.getData();
            if (data == null) {
                continue;
            }

            long sizeBytes = data.length();
            att.setSizeBytes(sizeBytes);

            if (!embedFullAttachments) {
                // If attachment is large (above threshold) or is long text/JSON/XML
                if (sizeBytes > thresholdBytes || sizeBytes > 200) {
                    try {
                        String fileId = externalizer.saveAttachment(data);
                        att.setExternal(true);
                        att.setExternalFileId(fileId);

                        // Truncate preview to 200 chars if not fully embedded
                        if (sizeBytes > 200) {
                            String preview = data.substring(0, 200) + "...";
                            att.setData(preview);
                            att.setTruncated(true);
                        }
                    } catch (IOException e) {
                        LOGGER.log(Level.WARNING, "Failed to externalize attachment fragment: " + att.getName(), e);
                    }
                }
            }
        }
        return attachments.size();
    }

    private void savePayloadToGzip(CucumberReportPayload payload) throws IOException {
        File targetGzFile = new File(buildRootDir, REPORT_GZ_FILENAME);
        try (OutputStream fos = new FileOutputStream(targetGzFile);
             GZIPOutputStream gzos = new GZIPOutputStream(fos)) {
            OBJECT_MAPPER.writeValue(gzos, payload);
        }
        LOGGER.log(Level.FINE, "Saved compressed BDD report to: {0} ({1} bytes)",
                new Object[]{targetGzFile.getAbsolutePath(), targetGzFile.length()});
    }

    /**
     * Reads and decompresses the report payload from cucumber-report.json.gz on disk.
     */
    public static CucumberReportPayload loadPayloadFromGzip(File buildRootDir) throws IOException {
        File gzFile = new File(buildRootDir, REPORT_GZ_FILENAME);
        if (!gzFile.exists()) {
            return null;
        }
        try (InputStream fis = new FileInputStream(gzFile);
             GZIPInputStream gzis = new GZIPInputStream(fis)) {
            return OBJECT_MAPPER.readValue(gzis, CucumberReportPayload.class);
        }
    }

    /**
     * Reads decompressed JSON string directly from cucumber-report.json.gz.
     */
    public static String readRawJsonFromGzip(File buildRootDir) throws IOException {
        File gzFile = new File(buildRootDir, REPORT_GZ_FILENAME);
        if (!gzFile.exists()) {
            return "{}";
        }
        try (InputStream fis = new FileInputStream(gzFile);
             GZIPInputStream gzis = new GZIPInputStream(fis)) {
            return IOUtils.toString(gzis, StandardCharsets.UTF_8);
        }
    }
}
