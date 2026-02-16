package com.baatcheet.websocket;

import com.baatcheet.dto.SignalMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class CallSocketHandler extends TextWebSocketHandler {

    // Thread-safe maps and queues
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> pairs = new ConcurrentHashMap<>(); // SessionID -> PartnerSessionID

    // 🔥 Missing piece: The waiting queue
    private final Queue<WebSocketSession> waitingQueue = new ConcurrentLinkedQueue<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        waitingQueue.remove(session);

        // If a user disconnects, notify their partner
        String partnerId = pairs.remove(session.getId());
        if (partnerId != null) {
            pairs.remove(partnerId);
            WebSocketSession partner = sessions.get(partnerId);
            if (partner != null && partner.isOpen()) {
                // Optional: Send a "partner_disconnected" signal here
                waitingQueue.add(partner); // Put partner back in queue?
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            // Convert JSON string to Java Object automatically
            SignalMessage signal = objectMapper.readValue(message.getPayload(), SignalMessage.class);

            if ("join".equals(signal.type())) {
                handleJoin(session);
            } else {
                forwardSignal(session, message);
            }
        } catch (Exception e) {
            System.err.println("Invalid JSON received: " + message.getPayload());
        }
    }

    private void handleJoin(WebSocketSession session) throws IOException {
        cleanQueue(); // Remove disconnected users first

        WebSocketSession partner = findPartner(session);

        if (partner != null) {
            pairs.put(session.getId(), partner.getId());
            pairs.put(partner.getId(), session.getId());

            // Send Java Objects, converted to JSON automatically
            sendJson(partner, new SignalMessage("start", null, null, getUserName(session), true, "caller"));
            sendJson(session, new SignalMessage("start", null, null, getUserName(partner), true, "receiver"));
        } else {
            // No partner found, add to queue
            if (!waitingQueue.contains(session)) {
                waitingQueue.add(session);
            }
        }
    }

    private WebSocketSession findPartner(WebSocketSession session) {
        // You cannot pair with yourself
        if (waitingQueue.isEmpty()) return null;

        WebSocketSession candidate = waitingQueue.poll();

        // If the candidate is strictly equal to 'session', putting them back is tricky
        // because we just polled them. But usually, the current 'session'
        // isn't in the queue yet when calling this.
        if (candidate != null && candidate.getId().equals(session.getId())) {
            waitingQueue.add(candidate);
            return null;
        }

        return candidate;
    }

    private void forwardSignal(WebSocketSession sender, TextMessage message) throws IOException {
        String partnerId = pairs.get(sender.getId());
        if (partnerId != null) {
            WebSocketSession partner = sessions.get(partnerId);
            if (partner != null && partner.isOpen()) {
                partner.sendMessage(message);
            }
        }
    }

    private void sendJson(WebSocketSession session, Object response) throws IOException {
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }

    // ================= HELPERS =================

    private String getUserName(WebSocketSession session) {
        if (session.getPrincipal() != null) {
            return session.getPrincipal().getName();
        }
        return "User";
    }

    private void cleanQueue() {
        waitingQueue.removeIf(s -> !s.isOpen());
    }
}