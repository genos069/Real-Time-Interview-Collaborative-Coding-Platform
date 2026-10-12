package com.interviewplatform.backend.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Experience {

    private String id;
    private String title;
    private String company;
    private String startDate;
    private String endDate;
    private boolean current;
    private String description;

    // For backwards compatibility with existing UI components referencing role / period
    private String role;
    private String period;

    public String getRole() {
        return (role != null && !role.isBlank()) ? role : title;
    }

    public String getTitle() {
        return (title != null && !title.isBlank()) ? title : role;
    }
}
