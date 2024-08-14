import React, { useMemo } from "react";

import { i18n } from "@Renderer/i18n";

import Callout from "@Renderer/components/molecules/Callout/Callout";
import Heading from "@Renderer/components/atoms/Heading";
import { Button } from "@Renderer/components/atoms/Button";

interface NoKeyTransparentTabProps {
  keyCode: any;
  isStandardView: boolean;
  onKeySelect: (keycode: number) => void;
  disabled?: boolean;
}
const NoKeyTransparentTab = ({ keyCode, onKeySelect, isStandardView, disabled }: NoKeyTransparentTabProps) => {
  const KC = useMemo(() => {
    if (keyCode?.base !== undefined && keyCode?.modified !== undefined) {
      return keyCode.base + keyCode.modified;
    }
    return undefined;
  }, [keyCode]);
  return (
    <div
      className={`w-full ${isStandardView ? "standardViewTab" : ""} tabsNoKeysTransparent ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="tabContentWrapper">
        <div className="buttonsRow">
          {/* <Heading renderAs="h3" headingLevel={3}>
            {i18n.editor.standardView.noKeyTransparent}{" "}
          </Heading> */}
          <Callout size="sm" className="mt-0">
            <p>{i18n.editor.standardView.callOut}</p>
          </Callout>
          <div className="flex flex-wrap py-2 gap-1">
            <div className="keysButtonsList flex-1 py-2">
              <Heading renderAs="h4" headingLevel={4} className="my-0 w-full text-base">
                {i18n.editor.standardView.noKey}
              </Heading>
              <p className="description text-ssm font-medium text-gray-400 dark:text-gray-200">
                {i18n.editor.standardView.noKeyDescription}
              </p>
              <Button
                variant="config"
                onClick={() => {
                  onKeySelect(0);
                }}
                size="sm"
                className="max-w-[124px] w-[124px] text-center mt-1"
                selected={KC === 0}
              >
                {i18n.editor.standardView.noKey}
              </Button>
            </div>
            <div className="keysButtonsList flex-1 py-2">
              <Heading headingLevel={4} renderAs="h4" className="my-0 w-full text-base">
                {i18n.editor.standardView.transparent}
              </Heading>
              <p className="description text-ssm font-medium text-gray-400 dark:text-gray-200">
                {i18n.editor.standardView.transparentDescription}
              </p>
              <Button
                variant="config"
                onClick={() => {
                  onKeySelect(65535);
                }}
                selected={KC === 65535}
                size="sm"
                className="max-w-[124px] w-[124px] text-center mt-1"
              >
                {i18n.editor.standardView.transparent}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoKeyTransparentTab;
