package com.baatcheet.service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {
    // Use a Set to track online users looking for a match
    private final Set<String> waitingQueue = ConcurrentHashMap.newKeySet();

    public synchronized String findMatch(String userId) {
        if (waitingQueue.isEmpty()) {
            waitingQueue.add(userId);
            return null; // You are now waiting
        } else {
            String partner = waitingQueue.iterator().next();
            waitingQueue.remove(partner);
            return partner; // Found a match!
        }
    }

    public void removeUser(String userId) {
        waitingQueue.remove(userId);
    }
}