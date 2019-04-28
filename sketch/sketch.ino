#include "HX711.h"


// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 2;
const int LOADCELL_SCK_PIN = 3;


HX711 scale;

void setup() {

  
  // initialize serial communications at 9600 bps:
  Serial.begin(115200);

  // Initialize library with data output pin, clock input pin and gain factor.
  // Channel selection is made by passing the appropriate gain:
  // - With a gain factor of 64 or 128, channel A is selected
  // - With a gain factor of 32, channel B is selected
  // By omitting the gain factor parameter, the library
  // default "128" (Channel A) is used here.
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  /*
  Serial.println("Before setting up the scale:");
  Serial.print("read: \t\t");
  Serial.println(scale.read());      // print a raw reading from the ADC

  Serial.print("read average: \t\t");
  Serial.println(scale.read_average(20));   // print the average of 20 readings from the ADC

  Serial.print("get value: \t\t");
  Serial.println(scale.get_value(5));   // print the average of 5 readings from the ADC minus the tare weight (not set yet)
  
  Serial.print("get units: \t\t");
  Serial.println(scale.get_units(5), 1);  // print the average of 5 readings from the ADC minus tare weight (not set) divided
  */

  scale.set_scale(442.325f);                      // this value is obtained by calibrating the scale with known weights; see the README for details
  scale.tare();               // reset the scale to 0
  
}

void loop() {
  if (Serial.available() > 0) {
    int b = Serial.read();
    if (b == '\n') {
      int a = analogRead(A0);
      int b = analogRead(A1);
      float load = scale.get_units(10);

      Serial.print(a);
      Serial.print(",");
      Serial.print(b);
      Serial.print(",");
      Serial.println(load);
    }
  }
}
