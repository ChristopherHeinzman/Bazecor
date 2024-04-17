import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";

import Heading from "@Renderer/components/ui/heading";
import { IconSettings } from "@Renderer/component/Icon";

import { DevicePreview } from "@Renderer/modules/DevicePreview";

import Styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { i18n } from "@Renderer/i18n";

const CardWrapper = Styled.div`
  
  .buttonToggler.dropdown-toggle.btn.btn-primary {
    width: 52px;
    height: 52px;
    &:hover {
      background-color: ${({ theme }) => theme.styles.card.cardDevice.dropdownBgColor};
    }
  }
  .dropdown-item.disabled {
    color: ${({ theme }) => theme.styles.card.cardDevice.dropdownDisabledColor};
  }

`;

const CardDevice = (props: any) => {
  const { device, filterBy } = props;
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();

  const handlePreferences = () => {
    if (isConnected) {
      navigate("/preferences");
    }
  };

  const filterAttribute = (filter: any) => {
    switch (filter) {
      case true:
        return "show-online";
        break;
      case false:
        return "show-offline";
        break;
      default:
        return "all";
    }
  };
  return (
    <CardWrapper
      className={`card-device flex flex-col relative p-0 rounded-[24px] border-2 border-solid bg-cardDeviceTextureLight dark:bg-cardDeviceTextureDark  bg-no-repeat bg-right-top bg-cover transition-all overflow-hidden ${
        isConnected
          ? "card-connected border-purple-300 dark:border-green-200"
          : "card-disconnected border-gray-100 dark:border-gray-600"
      } ${
        device.available
          ? "card-online"
          : "card-offline relative isolate before:absolute before:content-[''] before:w-full before:h-full before:bg-bgCardOfflineLight before:dark:bg-bgCardOfflineDark"
      } ${filterBy !== "all" ? `card-filter-on ${filterAttribute(filterBy)}` : "card-all"}`}
    >
      <div className="card-header relative bg-transparent border-none pt-6 min-h-[140px]">
        {device.name ? (
          <>
            <Heading headingLevel={3} renderAs="h3" className="text-gray-600 dark:text-gray-50">
              {device.name}
            </Heading>
            <Heading headingLevel={4} renderAs="h4" className="text-base text-gray-400 dark:text-gray-50">
              {device.device.info.displayName} {device.device.info.product === "Raise" ? device.device.info.keyboardType : null}
            </Heading>
          </>
        ) : (
          <Heading headingLevel={3} renderAs="h3" className="text-gray-600 dark:text-gray-50">
            {device.device.info.displayName} {device.device.info.product === "Raise" ? device.device.info.keyboardType : null}
          </Heading>
        )}
        <Heading
          headingLevel={5}
          renderAs="h5"
          className="text-xs normal-case tracking-normal mt-2 text-gray-300 dark:text-gray-100"
        >
          {device.path}
        </Heading>
        <span
          className={`bullet-connect absolute right-6 top-6 w-2 h-2 rounded-full  ${
            isConnected ? "connected bg-purple-300 dark:bg-green-200" : "disconnected bg-gray-200"
          }`}
        >
          &nbsp;
        </span>
      </div>
      <div
        className={`mb-[-20%] mt-[-14%] flex justify-end [&_canvas]:transition-all [&_canvas]:translate-x-[24%] ${
          device.available ? "relative " : "relative -z-[1] [&_canvas]:opacity-25 [&_canvas]:dark:opacity-100"
        }`}
      >
        <DevicePreview deviceName={device.device.info.displayName} isConnected={isConnected} />
      </div>
      <div className="card-footer bg-transparent border-none p-0.5 mt-auto">
        <div className="card-footer--inner flex justify-between items-center rounded-[18px] p-4 bg-gray-25/80 dark:bg-gray-700/70 backdrop-blur-sm">
          {device.available ? (
            <button
              type="button"
              onClick={() => setIsConnected(!isConnected)}
              className={`button m-0 h-[52px] focus:shadow-none focus-within:shadow-none ${
                isConnected ? "outline transp-bg" : "primary"
              }`}
            >
              {isConnected ? i18n.keyboardSelect.disconnectFromBazecor : i18n.keyboardSelect.connect}
            </button>
          ) : (
            <span className="device-status text-sm text-red-100">Offline</span>
          )}
          <Dropdown>
            <Dropdown.Toggle className="buttonToggler">
              <div className="buttonTogglerInner">
                <IconSettings />
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdownMenu">
              <div className="dropdownMenuPadding">
                <Dropdown.Item disabled={!isConnected} onClick={handlePreferences}>
                  <div className="dropdownItem">Settings</div>
                </Dropdown.Item>
                <Dropdown.Item disabled={isConnected}>
                  <div className="dropdownItem">Forget this device</div>
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </CardWrapper>
  );
};

export default CardDevice;