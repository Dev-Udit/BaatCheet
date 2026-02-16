package com.baatcheet.controller;

import com.baatcheet.service.MatchService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/match")
public class MatchController {

    private final MatchService service;

    public MatchController(MatchService service) {
        this.service = service;
    }

    @PostMapping
    public String find(Authentication auth) {
        String peer = service.match(auth.getName());
        return peer == null ? "NO_PEER_ONLINE" : "PEER_CONNECTED";
    }
}
