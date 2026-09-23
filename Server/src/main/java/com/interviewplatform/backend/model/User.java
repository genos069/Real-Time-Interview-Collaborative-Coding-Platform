package com.interviewplatform.backend.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    private String name;

    private String email;

    private String role;

    private String password;

    // Profile Details
    private String title;

    private String location;

    private String avatar;

    private String about;

    // Skills
    private List<String> skills = new ArrayList<>();
    // Targets
    private List<String> targets = new ArrayList<>();
}