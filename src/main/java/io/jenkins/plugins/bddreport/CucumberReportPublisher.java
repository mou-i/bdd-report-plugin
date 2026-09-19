package io.jenkins.plugins.bddreport;

import edu.umd.cs.findbugs.annotations.NonNull;
import hudson.EnvVars;
import hudson.Extension;
import hudson.FilePath;
import hudson.Launcher;
import hudson.model.AbstractProject;
import hudson.model.Result;
import hudson.model.Run;
import hudson.model.TaskListener;
import hudson.tasks.BuildStepDescriptor;
import hudson.tasks.Publisher;
import hudson.tasks.Recorder;
import hudson.util.FormValidation;
import io.jenkins.plugins.bddreport.model.CucumberReportPayload;
import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.service.CucumberJsonParser;
import io.jenkins.plugins.bddreport.service.StorageOptimizer;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import hudson.model.Item;
import jenkins.model.Jenkins;
import jenkins.tasks.SimpleBuildStep;
import org.jenkinsci.Symbol;
import org.kohsuke.stapler.AncestorInPath;
import org.kohsuke.stapler.DataBoundConstructor;
import org.kohsuke.stapler.DataBoundSetter;
import org.kohsuke.stapler.QueryParameter;
import org.kohsuke.stapler.verb.POST;

/**
 * Jenkins Post-Build Publisher (Recorder) that parses Cucumber JSON files from the workspace,
 * compresses and optimizes report storage on the controller, and registers the CucumberReportAction.
 */
public class CucumberReportPublisher extends Recorder implements SimpleBuildStep {

    public static final String DEFAULT_JSON_PATTERN = "**/cucumber.json";
    public static final int DEFAULT_ATTACHMENT_THRESHOLD_KB = 500;

    private String jsonReportPath = DEFAULT_JSON_PATTERN;
    private boolean embedFullAttachments = false;
    private int attachmentThresholdKB = DEFAULT_ATTACHMENT_THRESHOLD_KB;
    private boolean failBuildOnTestFailure = false;
    private boolean ignoreMissingReports = false;

    @DataBoundConstructor
    public CucumberReportPublisher(String jsonReportPath) {
        this.jsonReportPath = (jsonReportPath != null && !jsonReportPath.trim().isEmpty())
                ? jsonReportPath.trim()
                : DEFAULT_JSON_PATTERN;
    }

    public String getJsonReportPath() {
        return jsonReportPath;
    }

    @DataBoundSetter
    public void setJsonReportPath(String jsonReportPath) {
        this.jsonReportPath = (jsonReportPath != null && !jsonReportPath.trim().isEmpty())
                ? jsonReportPath.trim()
                : DEFAULT_JSON_PATTERN;
    }

    public boolean isEmbedFullAttachments() {
        return embedFullAttachments;
    }

    @DataBoundSetter
    public void setEmbedFullAttachments(boolean embedFullAttachments) {
        this.embedFullAttachments = embedFullAttachments;
    }

    public int getAttachmentThresholdKB() {
        return attachmentThresholdKB;
    }

    @DataBoundSetter
    public void setAttachmentThresholdKB(int attachmentThresholdKB) {
        this.attachmentThresholdKB = attachmentThresholdKB > 0 ? attachmentThresholdKB : DEFAULT_ATTACHMENT_THRESHOLD_KB;
    }

    public boolean isFailBuildOnTestFailure() {
        return failBuildOnTestFailure;
    }

    @DataBoundSetter
    public void setFailBuildOnTestFailure(boolean failBuildOnTestFailure) {
        this.failBuildOnTestFailure = failBuildOnTestFailure;
    }

    public boolean isIgnoreMissingReports() {
        return ignoreMissingReports;
    }

    @DataBoundSetter
    public void setIgnoreMissingReports(boolean ignoreMissingReports) {
        this.ignoreMissingReports = ignoreMissingReports;
    }

    @Override
    public void perform(@NonNull Run<?, ?> run,
                        @NonNull FilePath workspace,
                        @NonNull EnvVars env,
                        @NonNull Launcher launcher,
                        @NonNull TaskListener listener) throws InterruptedException, IOException {

        listener.getLogger().println("[BDD Report] Scanning workspace for Cucumber JSON files matching pattern: " + jsonReportPath);

        String expandedPattern = env.expand(jsonReportPath);
        FilePath[] reportFiles = workspace.list(expandedPattern);

        if (reportFiles == null || reportFiles.length == 0) {
            String msg = "[BDD Report] No Cucumber JSON files found matching: " + expandedPattern;
            if (ignoreMissingReports) {
                listener.getLogger().println(msg + " (ignoring as configured)");
                return;
            } else {
                listener.getLogger().println(msg + " - Warning: Report generation skipped.");
                return;
            }
        }

        listener.getLogger().println("[BDD Report] Found " + reportFiles.length + " matching Cucumber report file(s). Processing...");

        CucumberJsonParser parser = new CucumberJsonParser();
        List<FeatureResult> allFeatures = new ArrayList<>();

        for (FilePath reportFile : reportFiles) {
            listener.getLogger().println("[BDD Report] Parsing file: " + reportFile.getRemote());
            try (InputStream is = reportFile.read()) {
                List<FeatureResult> features = parser.parseInputStream(is);
                allFeatures.addAll(features);
            } catch (Exception e) {
                listener.getLogger().println("[BDD Report] Error parsing Cucumber JSON file " + reportFile.getRemote() + ": " + e.getMessage());
            }
        }

        if (allFeatures.isEmpty()) {
            listener.getLogger().println("[BDD Report] Warning: No valid BDD features parsed from matched files.");
            return;
        }

        // Apply storage optimization, GZIP compression, and external fragmenting
        File buildRootDir = run.getRootDir();
        StorageOptimizer optimizer = new StorageOptimizer(buildRootDir, embedFullAttachments, attachmentThresholdKB);
        CucumberReportPayload payload = optimizer.optimizeAndSave(allFeatures, run.getDisplayName(), run.getUrl());

        // Register action on the build
        CucumberReportAction action = new CucumberReportAction(payload.getSummary());
        run.addAction(action);

        listener.getLogger().println(String.format("[BDD Report] Report successfully generated and compressed! Total Scenarios: %d (Passed: %d, Failed: %d, Skipped: %d)",
                payload.getSummary().getTotalScenarios(),
                payload.getSummary().getPassedScenarios(),
                payload.getSummary().getFailedScenarios(),
                payload.getSummary().getSkippedScenarios()));

        // Mark build as failed if configured and tests failed
        if (failBuildOnTestFailure && payload.getSummary().getFailedScenarios() > 0) {
            listener.getLogger().println("[BDD Report] Setting build status to FAILURE due to " + payload.getSummary().getFailedScenarios() + " failed scenario(s).");
            run.setResult(Result.FAILURE);
        }
    }

    @Symbol("cucumberReport")
    @Extension
    public static final class DescriptorImpl extends BuildStepDescriptor<Publisher> {

        @Override
        public boolean isApplicable(Class<? extends AbstractProject> aClass) {
            return true;
        }

        @NonNull
        @Override
        public String getDisplayName() {
            return "Publish BDD Cucumber Report";
        }

        @POST
        public FormValidation doCheckJsonReportPath(@AncestorInPath Item item, @QueryParameter String value) {
            if (item != null) {
                item.checkPermission(Item.CONFIGURE);
            } else {
                Jenkins.get().checkPermission(Jenkins.ADMINISTER);
            }
            if (value == null || value.trim().isEmpty()) {
                return FormValidation.error("Cucumber JSON file pattern cannot be empty (e.g. **/cucumber.json)");
            }
            return FormValidation.ok();
        }

        @POST
        public FormValidation doCheckAttachmentThresholdKB(@AncestorInPath Item item, @QueryParameter String value) {
            if (item != null) {
                item.checkPermission(Item.CONFIGURE);
            } else {
                Jenkins.get().checkPermission(Jenkins.ADMINISTER);
            }
            try {
                int kb = Integer.parseInt(value);
                if (kb <= 0) {
                    return FormValidation.error("Threshold must be a positive integer in kilobytes");
                }
                return FormValidation.ok();
            } catch (NumberFormatException e) {
                return FormValidation.error("Must be a valid integer");
            }
        }
    }
}
