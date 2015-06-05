/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package taurustest;

import java.util.HashMap;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.AssertJUnit;

public class TestUtilities {
    static By FEEDBACK_BUTTON = By.name("Feedback");
    static By SHARE_BUTTON = By.name("Share");
    static By SETTINGS_BUTTON = By.name("Settings");
    static By ABOUT = By.name("About");
    static By TUTORIAL =By.name("Tutorial");
    static By CANCEL_BUTTON = By.id("android:id/button2");
    static By REFRESH_RATE = By.name("Refresh Rate");
    static By RATE_OPTION = By.name("5 minutes");
    static By CHECK_BOX_FOR_NOTIFICATION = By.id("android:id/checkbox");
    static By MAX_NOTIFICATION_PER_INSTANCE = By.name(
          "Max Notifications Per Company");
    static By OPTION_MAX_NOTIFICATION_PER_INSTANCE = By.name("1 per hour");
    static By OK_BUTTON = By.name("OK");
    static By LABEL_SETTINGS = By.id("android:id/action_bar_title");
    static By LABEL_VERSION = By.name("Version");
    static By LABEL_NOTIFICATION = By.name("Notifications");
    static By DATA_SOURCES = By.name("Data Sources");
    static By BUTTON_ON_TUTORIAL =By.id("com.numenta.taurus:id/tutorial_button_right");
    static By SKIP_ON_TUTORIAL = By.id("com.numenta.taurus:id/tutorial_button_left");
    static int KEYCODE_MENU = 82;
    static By COMPANYNAME = By.id("com.numenta.taurus:id/ticker");

    public static void waitClick(By locator, WebDriver driver, int value) {
          WebDriverWait wait = new WebDriverWait(driver, value);
          wait.until(ExpectedConditions.presenceOfElementLocated(
                  locator)).click();
    }


    public static String waitGetText(By locator, WebDriver driver, int value) {
          WebDriverWait wait = new WebDriverWait(driver, value);
          return wait.until(ExpectedConditions.presenceOfElementLocated(locator))
                  .getText();
    }


    public static void longPressOnCompanyName(WebDriver driver)
              throws InterruptedException {
          WebElement clickInstance = driver.findElement(COMPANYNAME);
          JavascriptExecutor js = (JavascriptExecutor) driver;
          HashMap<String, String> tapObject = new HashMap<String, String>();
          tapObject.put("element", ((RemoteWebElement) clickInstance).getId());
          js.executeScript("mobile: longClick", tapObject);
    }


    public static void menuButtonClick(WebDriver driver) {
        HashMap<String, Integer> swipeObject = new HashMap<String, Integer>();
        swipeObject.put("keycode", KEYCODE_MENU);
        ((JavascriptExecutor)driver).executeScript(
                "mobile: keyevent", swipeObject);
    }


    public static void clickFeedback(WebDriver driver, int value) {
        menuButtonClick(driver);
        waitClick(FEEDBACK_BUTTON, driver, value);
        waitClick(CANCEL_BUTTON, driver, value);
    }


    public static void clickShare(WebDriver driver, int value) {
        menuButtonClick(driver);
        waitClick(SHARE_BUTTON, driver, value);
        driver.navigate().back();
    }


    public static void clickAbout(WebDriver driver, int value) {
        menuButtonClick(driver);
        waitClick(ABOUT, driver, value);
        driver.navigate().back();
    }


    public static void changeNotificationSettings(WebDriver driver, int value) {
        waitClick(MAX_NOTIFICATION_PER_INSTANCE, driver, value);
        waitClick(OPTION_MAX_NOTIFICATION_PER_INSTANCE, driver, value);
    }


    public static void clickSettingOptionAndChangeSettings(
        WebDriver driver, int value) throws InterruptedException {
        menuButtonClick(driver);
        waitClick(SETTINGS_BUTTON, driver, value);

        String settingLbl = waitGetText(LABEL_SETTINGS, driver, value);
        String versionLbl = waitGetText(LABEL_VERSION, driver, value);
        String notificationLbl = waitGetText(LABEL_NOTIFICATION, driver, value);
        String dataSourceLbl = waitGetText(DATA_SOURCES, driver, value);
        AssertJUnit.assertEquals(settingLbl,"Settings");
        AssertJUnit.assertEquals(versionLbl, "Version");
        AssertJUnit.assertEquals(notificationLbl, "Notifications");
        AssertJUnit.assertEquals(dataSourceLbl, "Data Sources");

        waitClick(REFRESH_RATE, driver, value);
        waitClick(RATE_OPTION, driver, value);
        changeNotificationSettings(driver, value);
        waitClick(CHECK_BOX_FOR_NOTIFICATION, driver, value);
        driver.navigate().back();
    }

    public static void swipe(WebDriver driver, boolean forward)
            throws InterruptedException {
        double startXValue, endXValue;
        if (forward) {
            startXValue = 0.95;
            endXValue = 0.05;
        } else {
            startXValue = 0.05;
            endXValue = 0.95;
        }
        JavascriptExecutor js = (JavascriptExecutor) driver;
        HashMap<String, Double> swipeObject = new HashMap<String, Double>();
        swipeObject.put("startX", startXValue);
        swipeObject.put("startY", 0.5);
        swipeObject.put("endX", endXValue);
        swipeObject.put("endY", 0.5);
        swipeObject.put("duration", 1.8);
        js.executeScript("mobile: swipe", swipeObject);
    }
}
