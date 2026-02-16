package com.baatcheet.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
public class AIController {

    private final ChatClient chatClient;

    public AIController(ChatClient.Builder builder) {
        this.chatClient = builder
                // Improved prompt for better, more conversational AI responses
                .defaultSystem("You are a friendly, encouraging conversational partner for someone practicing their spoken English. Respond in simple, natural English. Keep your responses brief (1 to 2 sentences max) so the user can easily listen and reply.")
                .build();
    }

    @PostMapping("/chat")
    public String chat(@RequestBody String userMessage) {
        return chatClient.prompt()
                .user(userMessage)
                .call()
                .content();
    }
}