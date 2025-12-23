/*
  BusWhere?! - ESP32 Client (Fixed Pins)
  Hardware: XIAO ESP32-S3 Plus + TRMNL/Seeed ePaper Expansion Board EE04
  Pinout: Based on Seeed_GFX Library definitions
*/

// Remember to set the wifi name and password as well as server IP

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <GxEPD2_BW.h>

// fix the flicker problem
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ------------------- PIN DEFINITIONS (From Seeed_GFX Library) -------------------
// These match the "USE_XIAO_EPAPER_DISPLAY_BOARD_EE04" definition
#define EPD_CS       44  // D7
#define EPD_DC       10  // D16 (Internal/Pad)
#define EPD_RST      38  // D11 (Internal/Pad)
#define EPD_BUSY     4   // D3 (Internal/Pad)
#define EPD_POWER_EN 43  // D6 - Power Switch

// ------------------- DISPLAY SELECTION -------------------
// GxEPD2_750_T7 is for the 800x480 7.5" Screen
GxEPD2_BW<GxEPD2_750_T7, GxEPD2_750_T7::HEIGHT> display(GxEPD2_750_T7(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));

// ------------------- USER CONFIGURATION -------------------
const char* ssid     = "WIFI";      
const char* password = "password";  

// UPDATE THIS IP: Use your computer's local IP (e.g., 192.168.1.15)
const char* serverUrl = "http://192.168.1.7:8080/api/create-bus-timings-image"; 

const size_t IMAGE_SIZE = 48000;
uint8_t* imageBuffer = nullptr;

void setup() {
  // WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable Brownout Detector
  // delay(500);
  Serial.begin(115200);
  // *** SAFETY ADDITION 1: THE UPLOAD SAVER ***
  // Gives you 3 seconds to hit "Upload" if the board gets stuck in a crash loop.
  // Without this, the board sleeps/crashes too fast to accept new code.
  delay(3000); 
  Serial.println("Starting...");

  // 1. Power On the Display (Critical for EE04 Board)
  // The expansion board has a power switch on Pin 43 (D6)
  pinMode(EPD_POWER_EN, OUTPUT);
  digitalWrite(EPD_POWER_EN, HIGH); 
  delay(100); // Wait for power to stabilize

  // 2. Allocate Memory
  if (psramInit()) {
    Serial.println("PSRAM found! Allocating buffer...");
    imageBuffer = (uint8_t*)ps_malloc(IMAGE_SIZE);
  } else {
    Serial.println("No PSRAM, using Heap...");
    imageBuffer = (uint8_t*)malloc(IMAGE_SIZE);
  }

  if (!imageBuffer) {
    Serial.println("CRITICAL ERROR: OOM");
    return;
  }

  // 3. Initialize Display
  // Use standard SPI pins (SCLK=D8, MOSI=D10) automatically
  display.init(115200);
  display.setRotation(0); 
  display.fillScreen(GxEPD_WHITE);
  display.display();

  // 4. Connect & Fetch
  connectToWiFi();
  fetchAndDrawImage();

  // *** SAFETY ADDITION 2: STABILIZE SCREEN ***
  // Ensures the image is "burned in" before cutting power
  Serial.println("Powering off display...");
  display.powerOff(); 
  delay(2000); // Critical delay to prevent image fading/flickering

  // 5. Deep Sleep (Refreshes every 60s)
  Serial.println("Sleep for 60s...");
  
  // OPTIONAL: Turn off screen power to save battery
  // digitalWrite(EPD_POWER_EN, LOW); 
  
  esp_sleep_enable_timer_wakeup(60 * 1000000ULL);
  esp_deep_sleep_start();
}

void loop() {
  // Unused due to Deep Sleep
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 20) ESP.restart();
  }
  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());
}

void fetchAndDrawImage() {
  HTTPClient http;
  http.begin(serverUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    int len = http.getSize();
    if (len == IMAGE_SIZE) {
      WiFiClient *stream = http.getStreamPtr();
      stream->readBytes(imageBuffer, IMAGE_SIZE);
      
      // *** SAFETY ADDITION 3: TURN OFF WIFI BEFORE DRAWING ***
      // Reduces current spike. Prevents brownout flickering.
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      Serial.println("WiFi OFF. Drawing...");

      Serial.println("Drawing Bitmap...");
      // Draw the raw 1-bit buffer directly
      display.drawImage(imageBuffer, 0, 0, 800, 480, false, false, false);
      Serial.println("Done!");
    } else {
      Serial.printf("Size Mismatch: Got %d, Expected %d\n", len, IMAGE_SIZE);
    }
  } else {
    Serial.printf("HTTP Failed: %d\n", httpCode);
  }
  http.end();
}