/*
  BusWhere?! - ESP32 Client (Interactive Fixed)
  Hardware: XIAO ESP32-S3 Plus + TRMNL/Seeed ePaper Expansion Board EE04
  
  Controls:
  - D1 Button: ENTER STANDBY (Stops updates, sleeps until woken)
  - D2 Button: WAKE UP / REFRESH (Resumes 1-minute updates)
*/

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <GxEPD2_BW.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ------------------- PIN DEFINITIONS -------------------
#define EPD_CS       44  
#define EPD_DC       10  
#define EPD_RST      38  
#define EPD_BUSY     4   
#define EPD_POWER_EN 43  

// Button Pins
const int BUTTON_SLEEP = D1; // Press to Pause
const int BUTTON_WAKE  = D2; // Press to Resume

// ------------------- RTC MEMORY (Survives Sleep) -------------------
RTC_DATA_ATTR bool isStandbyMode = false;

// ------------------- DISPLAY SETUP -------------------
GxEPD2_BW<GxEPD2_750_T7, GxEPD2_750_T7::HEIGHT> display(GxEPD2_750_T7(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));

const char* ssid      = "wifi";      
const char* password  = "password";  
const char* serverUrl = "http://192.168.1.7:8080/api/create-bus-timings-image"; 
const size_t IMAGE_SIZE = 48000;
uint8_t* imageBuffer = nullptr;

void setup() {
  Serial.begin(115200);
  delay(3000); // Safety delay for upload
  Serial.println("Starting...");

  // 1. Configure Buttons
  pinMode(BUTTON_SLEEP, INPUT_PULLUP);
  pinMode(BUTTON_WAKE, INPUT_PULLUP);

  // 2. CHECK WAKEUP CAUSE
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  
  // Logic: "EXT1" means a button woke us up.
  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT1) {
    if (isStandbyMode) {
      // We were in Standby, so the ONLY enabled button was WAKE (D2)
      isStandbyMode = false;
      Serial.println(">>> WAKING UP (Resuming Updates) <<<");
    } else {
      // We were Active, so the ONLY enabled button was SLEEP (D1)
      isStandbyMode = true;
      Serial.println(">>> PAUSING (Entering Standby) <<<");
    }
  }

  // ------------------- STANDBY MODE LOGIC -------------------
  if (isStandbyMode) {
    Serial.println("Status: STANDBY. Waiting for D2 to wake...");
    
    // Flash LED 3 times to confirm we are pausing
    pinMode(LED_BUILTIN, OUTPUT);
    for(int i=0; i<3; i++) { 
      digitalWrite(LED_BUILTIN, LOW); delay(100); 
      digitalWrite(LED_BUILTIN, HIGH); delay(100); 
    }

    // Configure Wakeup: ONLY wake if D2 (Wake Button) is pressed
    // Mask = 1 shifted left by the pin number
    // Mode = ANY_LOW (since button connects to ground)
    esp_sleep_enable_ext1_wakeup(1ULL << BUTTON_WAKE, ESP_EXT1_WAKEUP_ANY_LOW);
    
    // Go to deep sleep indefinitely (No Timer)
    esp_deep_sleep_start();
  }

  // ------------------- ACTIVE MODE LOGIC -------------------
  Serial.println("Status: ACTIVE. Fetching Data...");

  // 3. Power On Display
  pinMode(EPD_POWER_EN, OUTPUT);
  digitalWrite(EPD_POWER_EN, HIGH); 
  delay(100); 

  // 4. Allocate Memory
  if (psramInit()) {
    imageBuffer = (uint8_t*)ps_malloc(IMAGE_SIZE);
  } else {
    imageBuffer = (uint8_t*)malloc(IMAGE_SIZE);
  }

  if (imageBuffer) {
    // 5. Init Display
    display.init(115200);
    display.setRotation(0); 
    
    // 6. Connect & Draw
    connectToWiFi();
    fetchAndDrawImage();
    
    // 7. Power Off Display
    Serial.println("Powering off display...");
    display.powerOff();
    delay(2000); 
  } else {
    Serial.println("Error: Out of RAM");
  }

  // 8. Configure Wakeup for Next Loop
  Serial.println("Sleep for 60s (or press D1 to Pause)...");

  // Wakeup Option A: Timer (60 seconds)
  esp_sleep_enable_timer_wakeup(60 * 1000000ULL);

  // Wakeup Option B: Button D1 (Pause Button)
  // If user presses D1 during the 60s sleep, we wake up immediately to handle the pause
  esp_sleep_enable_ext1_wakeup(1ULL << BUTTON_SLEEP, ESP_EXT1_WAKEUP_ANY_LOW);

  esp_deep_sleep_start();
}

void loop() {
  // Unused
}

// ------------------- HELPER FUNCTIONS -------------------

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 20) ESP.restart();
  }
  Serial.println("\nConnected!");
}

void fetchAndDrawImage() {
  HTTPClient http;
  http.begin(serverUrl);
  http.setTimeout(8000); 
  
  int httpCode = http.GET();

  if (httpCode == 200) {
    if (http.getSize() == IMAGE_SIZE) {
      WiFiClient *stream = http.getStreamPtr();
      stream->readBytes(imageBuffer, IMAGE_SIZE);
      
      // Safety: Turn off WiFi to save power/prevent brownout
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      
      Serial.println("Drawing...");
      display.drawImage(imageBuffer, 0, 0, 800, 480, false, false, false);
      Serial.println("Done!");
    }
  } else {
    Serial.printf("HTTP Failed: %d\n", httpCode);
  }
  http.end();
}