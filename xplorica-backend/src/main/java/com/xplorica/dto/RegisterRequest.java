package com.xplorica.dto;

import com.xplorica.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6)
    private String password;
    @NotNull
    private User.Role role;  // TOURIST or GUIDE

    @Positive
    private Double hourlyRate; // required when role = GUIDE
}
