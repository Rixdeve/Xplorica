package com.xplorica.service;

import com.xplorica.dto.AuthResponse;
import com.xplorica.dto.LoginRequest;
import com.xplorica.dto.RegisterRequest;
import com.xplorica.entity.GuideProfile;
import com.xplorica.entity.User;
import com.xplorica.repository.GuideProfileRepository;
import com.xplorica.repository.UserRepository;
import com.xplorica.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final GuideProfileRepository guideRepo;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

        User user = User.builder()
            .email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .fullName(req.getFullName())
            .role(req.getRole())
            .build();
        userRepo.save(user);

        Long profileId = null;
        if (req.getRole() == User.Role.GUIDE) {
            if (req.getHourlyRate() == null || req.getHourlyRate() <= 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guides must provide a positive hourly rate");
            GuideProfile profile = GuideProfile.builder()
                .user(user)
                .hourlyRate(req.getHourlyRate())
                .languages(new ArrayList<>())
                .destinations(new ArrayList<>())
                .build();
            guideRepo.save(profile);
            profileId = profile.getId();
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse res = new AuthResponse();
        res.setToken(token);
        res.setRole(user.getRole().name());
        res.setUserId(user.getId());
        res.setFullName(user.getFullName());
        res.setGuideProfileId(profileId);
        return res;
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepo.findByEmail(req.getEmail()).orElseThrow();
        Long profileId = null;
        if (user.getRole() == User.Role.GUIDE) {
            profileId = guideRepo.findByUserId(user.getId())
                .map(GuideProfile::getId).orElse(null);
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse res = new AuthResponse();
        res.setToken(token);
        res.setRole(user.getRole().name());
        res.setUserId(user.getId());
        res.setFullName(user.getFullName());
        res.setGuideProfileId(profileId);
        return res;
    }
}
