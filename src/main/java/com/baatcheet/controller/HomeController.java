package com.baatcheet.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.security.Principal;

@Controller
public class HomeController {


    @GetMapping("/")
    public String home(Model model, Authentication auth) {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) auth;
        String name = token.getPrincipal().getAttribute("name");

        model.addAttribute("name", name);
        return "home";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }



    @GetMapping("/audio")
    public String audio(Model model, Authentication authentication) {

        OAuth2AuthenticationToken token =
                (OAuth2AuthenticationToken) authentication;

        OAuth2User user = token.getPrincipal();

        String displayName = user.getAttribute("name"); // REAL NAME
        model.addAttribute("userName", displayName);

        return "audio";
    }


    @GetMapping("/video")
    public String video(Model model, Authentication authentication) {

        String userName = "Guest";

        if (authentication != null && authentication.isAuthenticated()) {
            userName = authentication.getName();
        }
        model.addAttribute("userName", userName);
        return "video";
    }



    @GetMapping("/ai")
    public String ai() {
        return "ai";
    }
}
