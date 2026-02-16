package com.baatcheet.websocket;

import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.HashSet;
import java.util.Set;

public class SignalHandler extends TextWebSocketHandler {

    private static final Set<WebSocketSession> sessions = new HashSet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage msg)
            throws Exception {
        for (WebSocketSession s : sessions) {
            if (!s.getId().equals(session.getId())) {
                s.sendMessage(msg);
            }
        }
    }
}
