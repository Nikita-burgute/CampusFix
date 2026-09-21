package com.campusfix.backend.dto;

import com.campusfix.backend.enums.ComplaintStatus;
import com.campusfix.backend.enums.Priority;

public class ComplaintUpdateDTO {

    private String title;

    private String description;

    private ComplaintStatus status;

    private Priority priority;

    public ComplaintUpdateDTO() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }
}