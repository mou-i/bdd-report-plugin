package io.jenkins.plugins.bddreport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jenkins.plugins.bddreport.model.CucumberReportPayload;
import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.model.ReportSummary;
import io.jenkins.plugins.bddreport.service.AttachmentExternalizer;
import io.jenkins.plugins.bddreport.service.CucumberJsonParser;
import io.jenkins.plugins.bddreport.service.StorageOptimizer;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

public class StorageOptimizerTest {

    @TempDir
    Path tempDir;

    @Test
    public void testOptimizeAndSaveGzip() throws Exception {
        File buildRootDir = tempDir.resolve("build-1").toFile();
        buildRootDir.mkdirs();
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
        assertEquals(2, summary.getTotalFeatures());
        assertEquals(4, summary.getTotalScenarios());
        assertEquals(2, summary.getPassedScenarios());
        assertEquals(1, summary.getFailedScenarios());
        assertEquals(1, summary.getSkippedScenarios());
        assertEquals(50.0, summary.getPassPercentage(), 0.01);

        // Verify GZIP file was written on disk
        File gzFile = new File(buildRootDir, StorageOptimizer.REPORT_GZ_FILENAME);
        assertTrue(gzFile.exists(), "cucumber-report.json.gz must exist");
        assertTrue(gzFile.length() > 0, "cucumber-report.json.gz size must be > 0");

        // Decompress and verify integrity
        CucumberReportPayload loaded = StorageOptimizer.loadPayloadFromGzip(buildRootDir);
        assertNotNull(loaded);
        assertEquals(summary.getTotalScenarios(), loaded.getSummary().getTotalScenarios());

        // Verify Attachment Externalization
        File attDir = new File(buildRootDir, AttachmentExternalizer.ATTACHMENTS_DIR_NAME);
        if (attDir.exists()) {
            File[] fragments = attDir.listFiles();
            if (fragments != null && fragments.length > 0) {
                // Check that fragment file can be read back safely
                AttachmentExternalizer externalizer = new AttachmentExternalizer(buildRootDir);
                String content = externalizer.readAttachment(fragments[0].getName());
                assertNotNull(content);
                assertFalse(content.isEmpty());
            }
        }
    }
}
