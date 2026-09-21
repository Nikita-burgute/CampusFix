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
import org.springframework.stereotype.Service;

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
            Long complaintId,
            Long technicianId) {

        Complaint complaint =
                complaintRepository.findById(complaintId).orElse(null);

        User technician =
                userRepository.findById(technicianId).orElse(null);


        if (complaint == null ||
                technician == null ||
                technician.getRole() != Role.TECHNICIAN) {
            return null;
        }

        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaintRepository.save(complaint);

        ComplaintAssignment existingAssignment =
                assignmentRepository.findByComplaintId(complaintId).orElse(null);

        if (existingAssignment != null) {

            existingAssignment.setTechnician(technician);

            ComplaintAssignment updatedAssignment =
                    assignmentRepository.save(existingAssignment);

            return convertToResponseDTO(updatedAssignment);
        }

        ComplaintAssignment assignment = new ComplaintAssignment();

        assignment.setComplaint(complaint);
        assignment.setTechnician(technician);

        ComplaintAssignment savedAssignment =
                assignmentRepository.save(assignment);

        return convertToResponseDTO(savedAssignment);
    }


    public ComplaintAssignmentResponseDTO convertToResponseDTO(
            ComplaintAssignment assignment) {

        ComplaintAssignmentResponseDTO response =
                new ComplaintAssignmentResponseDTO();

        response.setId(assignment.getId());
        response.setComplaintId(
                assignment.getComplaint().getId()
        );
        response.setTechnicianId(
                assignment.getTechnician().getId()
        );

        return response;
    }
}