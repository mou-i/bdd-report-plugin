package io.jenkins.plugins.bddreport;

import hudson.model.Job;
import hudson.model.ProminentProjectAction;
import hudson.model.Run;

/**
 * Jenkins Action on the Job/Project level providing quick access to the latest BDD report.
 */
public class CucumberReportProjectAction implements ProminentProjectAction {

    private final Job<?, ?> job;

    public CucumberReportProjectAction(Job<?, ?> job) {
        this.job = job;
    }

    public Job<?, ?> getJob() {
        return job;
    }

    @Override
    public String getIconFileName() {
        return "symbol-document-text plugin-ionicons-api";
    }

    @Override
    public String getDisplayName() {
        return "Latest BDD Test Report";
    }

    @Override
    public String getUrlName() {
        return CucumberReportAction.URL_NAME;
    }

    public CucumberReportAction getLastReportAction() {
        if (job == null) {
            return null;
        }
        Run<?, ?> lastSuccessfulBuild = job.getLastSuccessfulBuild();
        if (lastSuccessfulBuild != null) {
            CucumberReportAction action = lastSuccessfulBuild.getAction(CucumberReportAction.class);
            if (action != null) {
                return action;
            }
        }
        Run<?, ?> lastBuild = job.getLastBuild();
        if (lastBuild != null) {
            return lastBuild.getAction(CucumberReportAction.class);
        }
        return null;
    }
}
