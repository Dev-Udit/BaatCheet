package com.baatcheet.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SignalMessage(
        String type,
        Object sdp,
        Object ice,
        String partnerName,
        boolean start,
        String role
) {}