package io.jenkins.plugins.bddreport;

import io.jenkins.plugins.bddreport.model.Attachment;
import io.jenkins.plugins.bddreport.model.CucumberReportPayload;
import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.model.ReportSummary;
import io.jenkins.plugins.bddreport.model.ScenarioResult;
import io.jenkins.plugins.bddreport.model.StepResult;
import io.jenkins.plugins.bddreport.service.AttachmentExternalizer;
import io.jenkins.plugins.bddreport.service.CucumberJsonParser;
import io.jenkins.plugins.bddreport.service.StorageOptimizer;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.List;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class StorageOptimizerTest {

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    @Test
    public void testOptimizeAndSaveGzip() throws Exception {
        File buildRootDir = tempFolder.newFolder("build-1");
        CucumberJsonParser parser = new CucumberJsonParser();
        List<FeatureResult> features;

        try (InputStream is = getClass().getResourceAsStream("/sample-cucumber.json")) {
            features = parser.parseInputStream(is);
        }

        // Run StorageOptimizer with threshold 1KB to test pruning & externalization
        StorageOptimizer optimizer = new StorageOptimizer(buildRootDir, false, 1);
        CucumberReportPayload payload = optimizer.optimizeAndSave(features, "Build #1", "/job/test/1");

        // Verify summary
        ReportSummary summary = payload.getSummary();
        Assert.assertEquals(2, summary.getTotalFeatures());
        Assert.assertEquals(4, summary.getTotalScenarios());
        Assert.assertEquals(2, summary.getPassedScenarios());
        Assert.assertEquals(1, summary.getFailedScenarios());
        Assert.assertEquals(1, summary.getSkippedScenarios());
        Assert.assertEquals(50.0, summary.getPassPercentage(), 0.01);

        // Verify GZIP file was written on disk
        File gzFile = new File(buildRootDir, StorageOptimizer.REPORT_GZ_FILENAME);
        Assert.assertTrue("cucumber-report.json.gz must exist", gzFile.exists());
        Assert.assertTrue("cucumber-report.json.gz size must be > 0", gzFile.length() > 0);

        // Decompress and verify integrity
        CucumberReportPayload loaded = StorageOptimizer.loadPayloadFromGzip(buildRootDir);
        Assert.assertNotNull(loaded);
        Assert.assertEquals(summary.getTotalScenarios(), loaded.getSummary().getTotalScenarios());

        // Verify Attachment Externalization
        File attDir = new File(buildRootDir, AttachmentExternalizer.ATTACHMENTS_DIR_NAME);
        if (attDir.exists()) {
            File[] fragments = attDir.listFiles();
            if (fragments != null && fragments.length > 0) {
                // Check that fragment file can be read back safely
                AttachmentExternalizer externalizer = new AttachmentExternalizer(buildRootDir);
                String content = externalizer.readAttachment(fragments[0].getName());
                Assert.assertNotNull(content);
                Assert.assertFalse(content.isEmpty());
            }
        }
    }
}
