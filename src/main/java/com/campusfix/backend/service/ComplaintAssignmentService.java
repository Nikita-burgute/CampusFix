
package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintAssignmentResponseDTO;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.entity.ComplaintAssignment;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.enums.ComplaintStatus;
import com.campusfix.backend.enums.Role;
import com.campusfix.backend.repository.ComplaintAssignmentRepository;
import com.campusfix.backend.repository.ComplaintRepository;
import com.campusfix.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

@Service
public class ComplaintAssignmentService {

    private final ComplaintAssignmentRepository assignmentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintAssignmentService(
            ComplaintAssignmentRepository assignmentRepository,
            ComplaintRepository complaintRepository,
            UserRepository userRepository) {

        this.assignmentRepository = assignmentRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    public ComplaintAssignmentResponseDTO assignComplaint(
            Long complaintId, Long technicianId) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Complaint not found"));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected user is not a technician");
        }

        ComplaintStatus status = complaint.getStatus();

        if (status != ComplaintStatus.REPORTED
                && status != ComplaintStatus.REOPENED
                && status != ComplaintStatus.ASSIGNED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only REPORTED, REOPENED, or ASSIGNED complaints can be assigned");
        }

        ComplaintAssignment assignment =
                assignmentRepository.findByComplaintId(complaintId)
                        .orElseGet(ComplaintAssignment::new);

        assignment.setComplaint(complaint);
        assignment.setTechnician(technician);

        ComplaintAssignment savedAssignment =
                assignmentRepository.save(assignment);

        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaintRepository.save(complaint);

        return convertToResponseDTO(savedAssignment);
    }

    public ComplaintAssignmentResponseDTO convertToResponseDTO(
            ComplaintAssignment assignment) {

        ComplaintAssignmentResponseDTO response =
                new ComplaintAssignmentResponseDTO();

        response.setId(assignment.getId());
        response.setComplaintId(assignment.getComplaint().getId());
        response.setTechnicianId(assignment.getTechnician().getId());

        return response;
    }

    public List<ComplaintAssignmentResponseDTO> getMyAssignments() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().equals("anonymousUser")) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        User technician = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only technicians can view their assignments");
        }

        return assignmentRepository.findByTechnicianId(technician.getId())
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

}
