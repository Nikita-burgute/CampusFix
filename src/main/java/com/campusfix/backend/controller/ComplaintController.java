package com.campusfix.backend.controller;

import com.campusfix.backend.dto.ComplaintRequestDTO;
import com.campusfix.backend.dto.ComplaintResponseDTO;
import com.campusfix.backend.dto.ComplaintUpdateDTO;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.service.ComplaintService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public Complaint createComplaint(@RequestBody ComplaintRequestDTO request) {
        return complaintService.createComplaint(request);
    }

    @GetMapping
    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintService.getAllComplaintResponses();
    }
    @GetMapping("/{id}")
    public ComplaintResponseDTO getComplaintById(@PathVariable Long id) {
        return complaintService.getComplaintResponseById(id);
    }

    @PutMapping("/{id}")
    public ComplaintResponseDTO updateComplaint(
            @PathVariable Long id,
            @RequestBody ComplaintUpdateDTO request) {

        return complaintService.updateComplaint(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteComplaint(@PathVariable Long id) {
        complaintService.deleteComplaint(id);
    }
}