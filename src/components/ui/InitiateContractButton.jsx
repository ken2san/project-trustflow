import React from "react";
import HoldButton from "./HoldButton";
import { Fingerprint } from "lucide-react";

/**
 * Unified Initiate Contract button for all views.
 * Props:
 * - onClick: function
 * - disabled: boolean
 * - label: string (optional, default: "Initiate Contract")
 * - className: string (optional, extra classes)
 * - ...rest: any other HoldButton props
 */
const InitiateContractButton = ({ onClick, disabled, label = "Initiate Contract", className = "", ...rest }) => (
  <HoldButton
    onClick={onClick}
    label={label}
    icon={Fingerprint}
    className={`btn-primary-hold ${className}`}
    disabled={disabled}
    {...rest}
  />
);

export default InitiateContractButton;
