package com.baatcheet.service;

import org.springframework.stereotype.Service;

@Service
public class MatchService {

    private String waitingUser = null;

    public synchronized String match(String email) {
        if (waitingUser == null) {
            waitingUser = email;
            return null;
        } else {
            String peer = waitingUser;
            waitingUser = null;
            return peer;
        }
    }
}
