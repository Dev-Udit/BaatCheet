package com.baatcheet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OllamaRequest {

    @JsonProperty("model")
    public String model;

    @JsonProperty("prompt")
    public String prompt;

    @JsonProperty("stream")
    public boolean stream;

    public OllamaRequest(String model, String prompt, boolean stream) {
        this.model = model;
        this.prompt = prompt;
        this.stream = stream; // MUST be false
    }
}
