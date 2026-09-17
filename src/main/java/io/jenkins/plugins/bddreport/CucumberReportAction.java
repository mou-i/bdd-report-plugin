package io.jenkins.plugins.bddreport;

import hudson.model.Action;
import hudson.model.Item;
import hudson.model.Run;
import io.jenkins.plugins.bddreport.model.CucumberReportPayload;
import io.jenkins.plugins.bddreport.model.ReportSummary;
import io.jenkins.plugins.bddreport.service.AttachmentExternalizer;
import io.jenkins.plugins.bddreport.service.StorageOptimizer;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.SoftReference;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.logging.Level;
import java.util.logging.Logger;
import jenkins.model.RunAction2;
import jenkins.tasks.SimpleBuildStep;
import org.apache.commons.io.IOUtils;
import org.kohsuke.stapler.HttpResponse;
import org.kohsuke.stapler.HttpResponses;
import org.kohsuke.stapler.QueryParameter;
import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.StaplerResponse;

/**
 * Jenkins Action attached to a specific Build (Run).
 * Serves the modern BDD interactive report and handles lazy-loading data and attachment requests.
 */
public class CucumberReportAction implements RunAction2, SimpleBuildStep.LastBuildAction {

    private static final Logger LOGGER = Logger.getLogger(CucumberReportAction.class.getName());
    public static final String URL_NAME = "cucumber-bdd-report";

    private transient Run<?, ?> run;
    private final ReportSummary summary;

    /**
     * SoftReference memory cache for the report payload.
     * Allows the JVM Garbage Collector to reclaim heap memory whenever memory is constrained,
     * ensuring zero memory leakage on the Jenkins Controller.
     */
    private transient SoftReference<CucumberReportPayload> payloadRef;

    public CucumberReportAction(ReportSummary summary) {
        this.summary = summary;
    }

    @Override
    public void onAttached(Run<?, ?> r) {
        this.run = r;
    }

    @Override
    public void onLoad(Run<?, ?> r) {
        this.run = r;
    }

    public Run<?, ?> getRun() {
        return run;
    }

    public ReportSummary getSummary() {
        return summary;
    }

    @Override
    public String getIconFileName() {
        return "symbol-document-text plugin-ionicons-api";
    }

    @Override
    public String getDisplayName() {
        return "BDD Test Report";
    }

    @Override
    public String getUrlName() {
        return URL_NAME;
    }

    @Override
    public Collection<? extends Action> getProjectActions() {
        if (run != null && run.getParent() != null) {
            return Collections.singleton(new CucumberReportProjectAction(run.getParent()));
        }
        return Collections.emptyList();
    }

    /**
     * Retrieves the report payload lazily from disk or from SoftReference cache.
     */
    public synchronized CucumberReportPayload getPayload() {
        if (payloadRef != null) {
            CucumberReportPayload payload = payloadRef.get();
            if (payload != null) {
                return payload;
            }
        }

        if (run != null) {
            try {
                CucumberReportPayload payload = StorageOptimizer.loadPayloadFromGzip(run.getRootDir());
                if (payload != null) {
                    payloadRef = new SoftReference<>(payload);
                    return payload;
                }
            } catch (IOException e) {
                LOGGER.log(Level.SEVERE, "Failed to decompress and load BDD report from disk", e);
            }
        }
        return null;
    }

    /**
     * Stapler Web Endpoint: Serves raw report JSON decompressed directly from GZIP stream to browser.
     * URL: buildUrl/cucumber-bdd-report/reportData
     */
    public void doReportData(StaplerRequest req, StaplerResponse rsp) throws IOException {
        if (run != null) {
            run.checkPermission(Item.READ);
        }

        rsp.setContentType("application/json;charset=UTF-8");
        rsp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        if (run == null) {
            rsp.getWriter().write("{}");
            return;
        }

        String json = StorageOptimizer.readRawJsonFromGzip(run.getRootDir());
        rsp.getWriter().write(json);
    }

    /**
     * Stapler Web Endpoint: Serves or downloads an externalized attachment fragment.
     * URL: buildUrl/cucumber-bdd-report/attachment?fileId=att-xxx.dat&mimeType=image/png&download=true
     */
    public void doAttachment(@QueryParameter(required = true) String fileId,
                             @QueryParameter String mimeType,
                             @QueryParameter boolean download,
                             @QueryParameter String name,
                             StaplerRequest req,
                             StaplerResponse rsp) throws IOException {
        if (run != null) {
            run.checkPermission(Item.READ);
        }

        if (fileId == null || fileId.trim().isEmpty()) {
            rsp.sendError(400, "Missing fileId parameter");
            return;
        }

        AttachmentExternalizer externalizer = new AttachmentExternalizer(run.getRootDir());
        File attachmentFile;
        try {
            attachmentFile = externalizer.getAttachmentFile(fileId);
        } catch (SecurityException se) {
            rsp.sendError(403, "Access denied: " + se.getMessage());
            return;
        }

        if (!attachmentFile.exists() || !attachmentFile.isFile()) {
            rsp.sendError(404, "Attachment fragment not found");
            return;
        }

        String contentType = (mimeType != null && !mimeType.trim().isEmpty()) ? mimeType : "text/plain";
        rsp.setContentType(contentType);

        if (download) {
            String downloadName = (name != null && !name.trim().isEmpty()) ? name : fileId;
            String encodedName = URLEncoder.encode(downloadName, StandardCharsets.UTF_8.name()).replace("+", "%20");
            rsp.setHeader("Content-Disposition", "attachment; filename=\"" + encodedName + "\"");
        }

        try (InputStream is = new FileInputStream(attachmentFile);
             OutputStream os = rsp.getOutputStream()) {
            IOUtils.copy(is, os);
        }
    }

    /**
     * Stapler Web Endpoint: Allows downloading full decompressed report JSON file.
     * URL: buildUrl/cucumber-bdd-report/downloadReport
     */
    public void doDownloadReport(StaplerRequest req, StaplerResponse rsp) throws IOException {
        if (run != null) {
            run.checkPermission(Item.READ);
        }

        rsp.setContentType("application/json;charset=UTF-8");
        rsp.setHeader("Content-Disposition", "attachment; filename=\"cucumber-report-" + (run != null ? run.getNumber() : "export") + ".json\"");

        if (run != null) {
            String json = StorageOptimizer.readRawJsonFromGzip(run.getRootDir());
            rsp.getWriter().write(json);
        } else {
            rsp.getWriter().write("{}");
        }
    }
}
