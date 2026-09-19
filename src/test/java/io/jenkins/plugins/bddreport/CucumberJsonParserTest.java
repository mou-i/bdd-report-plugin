package io.jenkins.plugins.bddreport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.model.ScenarioResult;
import io.jenkins.plugins.bddreport.model.StepResult;
import io.jenkins.plugins.bddreport.service.CucumberJsonParser;
import java.io.InputStream;
import java.util.List;
import org.junit.jupiter.api.Test;

public class CucumberJsonParserTest {

    @Test
    public void testParseSampleCucumberJson() throws Exception {
        CucumberJsonParser parser = new CucumberJsonParser();
        List<FeatureResult> features;

        try (InputStream is = getClass().getResourceAsStream("/sample-cucumber.json")) {
            assertNotNull(is, "sample-cucumber.json must exist in classpath");
            features = parser.parseInputStream(is);
        }

        assertEquals(2, features.size(), "Expected 2 features");

        // Feature 1
        FeatureResult authFeature = features.get(0);
        assertEquals("User Authentication & Access Control", authFeature.getName());
        assertEquals("failed", authFeature.getStatus());
        assertEquals(2, authFeature.getScenarios().size());

        // Scenario 1 (Passed)
        ScenarioResult passScenario = authFeature.getScenarios().get(0);
        assertEquals("Successful login with valid credentials", passScenario.getName());
        assertEquals("passed", passScenario.getStatus());
        assertEquals(3, passScenario.getSteps().size());
        assertTrue(passScenario.getTags().contains("@auth"), "Should inherit feature tag @auth");
        assertTrue(passScenario.getTags().contains("@positive"), "Should contain scenario tag @positive");

        // Scenario 2 (Failed)
        ScenarioResult failScenario = authFeature.getScenarios().get(1);
        assertEquals("Login fails with invalid password", failScenario.getName());
        assertEquals("failed", failScenario.getStatus());
        assertNotNull(failScenario.getErrorMessage(), "Should contain error message");
        assertTrue(failScenario.getErrorMessage().contains("AssertionError"));

        // Check Attachments in Failed Step
        StepResult failedStep = failScenario.getSteps().get(1);
        assertEquals(2, failedStep.getAttachments().size());
        assertEquals("failure-screenshot.png", failedStep.getAttachments().get(0).getName());
        assertEquals("server-error-log.txt", failedStep.getAttachments().get(1).getName());

        // Feature 2: Check DataTable and Duration Warning (> 5.0s)
        FeatureResult checkoutFeature = features.get(1);
        assertEquals("Order Checkout & Payment Gateway", checkoutFeature.getName());
        ScenarioResult cardScenario = checkoutFeature.getScenarios().get(0);

        StepResult dataTableStep = cardScenario.getSteps().get(0);
        assertEquals(3, dataTableStep.getRows().size());
        assertEquals("Item SKU", dataTableStep.getRows().get(0).getCells().get(0));

        StepResult longStep = cardScenario.getSteps().get(1);
        assertTrue(longStep.isDurationWarning(), "Step with 5.4s duration should trigger duration warning");

        // Check unnamed attachment defaulting
        StepResult invoiceStep = cardScenario.getSteps().get(2);
        assertEquals(1, invoiceStep.getAttachments().size());
        assertTrue(invoiceStep.getAttachments().get(0).getName().startsWith("Attachment -"),
                "Unnamed attachment should default to Attachment - <index>");
    }
}
