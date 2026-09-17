package io.jenkins.plugins.bddreport;

import io.jenkins.plugins.bddreport.model.FeatureResult;
import io.jenkins.plugins.bddreport.model.ScenarioResult;
import io.jenkins.plugins.bddreport.model.StepResult;
import io.jenkins.plugins.bddreport.service.CucumberJsonParser;
import java.io.InputStream;
import java.util.List;
import org.junit.Assert;
import org.junit.Test;

public class CucumberJsonParserTest {

    @Test
    public void testParseSampleCucumberJson() throws Exception {
        CucumberJsonParser parser = new CucumberJsonParser();
        List<FeatureResult> features;

        try (InputStream is = getClass().getResourceAsStream("/sample-cucumber.json")) {
            Assert.assertNotNull("sample-cucumber.json must exist in classpath", is);
            features = parser.parseInputStream(is);
        }

        Assert.assertEquals("Expected 2 features", 2, features.size());

        // Feature 1
        FeatureResult authFeature = features.get(0);
        Assert.assertEquals("User Authentication & Access Control", authFeature.getName());
        Assert.assertEquals("failed", authFeature.getStatus());
        Assert.assertEquals(2, authFeature.getScenarios().size());

        // Scenario 1 (Passed)
        ScenarioResult passScenario = authFeature.getScenarios().get(0);
        Assert.assertEquals("Successful login with valid credentials", passScenario.getName());
        Assert.assertEquals("passed", passScenario.getStatus());
        Assert.assertEquals(3, passScenario.getSteps().size());
        Assert.assertTrue("Should inherit feature tag @auth", passScenario.getTags().contains("@auth"));
        Assert.assertTrue("Should contain scenario tag @positive", passScenario.getTags().contains("@positive"));

        // Scenario 2 (Failed)
        ScenarioResult failScenario = authFeature.getScenarios().get(1);
        Assert.assertEquals("Login fails with invalid password", failScenario.getName());
        Assert.assertEquals("failed", failScenario.getStatus());
        Assert.assertNotNull("Should contain error message", failScenario.getErrorMessage());
        Assert.assertTrue(failScenario.getErrorMessage().contains("AssertionError"));

        // Check Attachments in Failed Step
        StepResult failedStep = failScenario.getSteps().get(1);
        Assert.assertEquals(2, failedStep.getAttachments().size());
        Assert.assertEquals("failure-screenshot.png", failedStep.getAttachments().get(0).getName());
        Assert.assertEquals("server-error-log.txt", failedStep.getAttachments().get(1).getName());

        // Feature 2: Check DataTable and Duration Warning (> 5.0s)
        FeatureResult checkoutFeature = features.get(1);
        Assert.assertEquals("Order Checkout & Payment Gateway", checkoutFeature.getName());
        ScenarioResult cardScenario = checkoutFeature.getScenarios().get(0);

        StepResult dataTableStep = cardScenario.getSteps().get(0);
        Assert.assertEquals(3, dataTableStep.getRows().size());
        Assert.assertEquals("Item SKU", dataTableStep.getRows().get(0).getCells().get(0));

        StepResult longStep = cardScenario.getSteps().get(1);
        Assert.assertTrue("Step with 5.4s duration should trigger duration warning", longStep.isDurationWarning());

        // Check unnamed attachment defaulting
        StepResult invoiceStep = cardScenario.getSteps().get(2);
        Assert.assertEquals(1, invoiceStep.getAttachments().size());
        Assert.assertTrue("Unnamed attachment should default to Attachment - <index>",
                invoiceStep.getAttachments().get(0).getName().startsWith("Attachment -"));
    }
}
