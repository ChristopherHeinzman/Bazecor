import React from "react";

// Bootstrap components
import Styled from "styled-components";
import Card from "react-bootstrap/Card";
import i18n from "../../i18n";

// Custom components
import Title from "../../component/Title";
import { BatteryStatusSide, SavingModeIndicator } from "../../component/Battery";

// Assets
import { IconBattery } from "../../component/Icon";

const Styles = Styled.div`
padding-top: 24px;
.card {
  height: inherit;
}
.battery-defy--indicator {
  display: flex;
  grid-gap: 8px;
  margin-bottom: 42px;
  position: relative;
  max-width: 202px;
}
`;

interface BatterySettingsProps {
  wireless: {
    battery: {
      LeftLevel?: number;
      LeftState?: number;
      RightLevel?: number;
      RightState?: number;
      savingMode?: boolean;
    };
  };
  toggleSavingMode: boolean;
}

function BatterySettings({ wireless }: BatterySettingsProps) {
  // console.log("Wireless: ", wireless);
  return (
    <Styles>
      <Card className="overflowFix card-preferences">
        <Card.Title>
          <Title text={i18n.wireless.batteryPreferences.battery} headingLevel={3} svgICO={<IconBattery />} />
        </Card.Title>
        <Card.Body className="py-0">
          <div className="battery-defy--indicator">
            <BatteryStatusSide
              side="left"
              batteryLevel={wireless.battery ? wireless.battery.LeftLevel : 100}
              isSavingMode={wireless.battery ? wireless.battery.savingMode : false}
              batteryStatus={wireless.battery ? wireless.battery.LeftState : 0}
              size="lg"
            />
            <BatteryStatusSide
              side="right"
              batteryLevel={wireless.battery ? wireless.battery.RightLevel : 100}
              isSavingMode={wireless.battery ? wireless.battery.savingMode : false}
              batteryStatus={wireless.battery ? wireless.battery.RightState : 0}
              size="lg"
            />
            <SavingModeIndicator isSavingMode={wireless.battery ? wireless.battery.savingMode : false} />
          </div>
        </Card.Body>
      </Card>
    </Styles>
  );
}

export default BatterySettings;