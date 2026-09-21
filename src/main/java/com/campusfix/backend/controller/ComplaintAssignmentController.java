package com.campusfix.backend.controller;

import com.campusfix.backend.dto.ComplaintAssignmentResponseDTO;
import com.campusfix.backend.entity.ComplaintAssignment;
import com.campusfix.backend.service.ComplaintAssignmentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assignments")
public class ComplaintAssignmentController {

    private final ComplaintAssignmentService assignmentService;

    public ComplaintAssignmentController(
            ComplaintAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ComplaintAssignmentResponseDTO assignComplaint(
            @RequestParam Long complaintId,
            @RequestParam Long technicianId) {

        return assignmentService.assignComplaint(
                complaintId,
                technicianId
        );
    }
}