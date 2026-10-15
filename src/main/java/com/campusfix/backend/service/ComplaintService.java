
package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintRequestDTO;
import com.campusfix.backend.dto.ComplaintResponseDTO;
import com.campusfix.backend.dto.ComplaintUpdateDTO;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.entity.ComplaintAssignment;
import com.campusfix.backend.entity.Equipment;
import com.campusfix.backend.entity.Location;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.enums.ComplaintStatus;
import com.campusfix.backend.enums.Role;
import com.campusfix.backend.repository.ComplaintAssignmentRepository;
import com.campusfix.backend.repository.ComplaintRepository;
import com.campusfix.backend.repository.EquipmentRepository;
import com.campusfix.backend.repository.LocationRepository;
import com.campusfix.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final EquipmentRepository equipmentRepository;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            LocationRepository locationRepository,
            EquipmentRepository equipmentRepository) {

        this.complaintRepository = complaintRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.equipmentRepository = equipmentRepository;
    }


    public ComplaintResponseDTO createComplaint(ComplaintRequestDTO request) {

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

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"));

        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only students can create complaints");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Location not found"));

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Equipment not found"));

        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(request.getPriority());
        complaint.setStatus(ComplaintStatus.REPORTED);
        complaint.setReportedBy(user);
        complaint.setLocation(location);
        complaint.setEquipment(equipment);

        return convertToResponseDTO(complaintRepository.save(complaint));
    }

    public ComplaintResponseDTO convertToResponseDTO(Complaint complaint) {

        ComplaintResponseDTO response = new ComplaintResponseDTO();
        response.setId(complaint.getId());
        response.setTitle(complaint.getTitle());
        response.setDescription(complaint.getDescription());
        response.setStatus(complaint.getStatus());
        response.setPriority(complaint.getPriority());
        response.setReportedById(complaint.getReportedBy().getId());
        response.setLocationId(complaint.getLocation().getId());
        response.setEquipmentId(complaint.getEquipment().getId());

        return response;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public ComplaintResponseDTO getComplaintResponseById(Long id) {
        Complaint complaint = findComplaint(id);
        return convertToResponseDTO(complaint);
    }

    public List<ComplaintResponseDTO> getAllComplaintResponses() {
        return complaintRepository.findAll()
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

    public ComplaintResponseDTO updateComplaint(
            Long id, ComplaintUpdateDTO request) {

        Complaint complaint = findComplaint(id);

        // Status must change only through workflow endpoints.
        if (request.getStatus() != null
                && request.getStatus() != complaint.getStatus()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Use the complaint workflow endpoints to change status");
        }

        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(request.getPriority());

        return convertToResponseDTO(complaintRepository.save(complaint));
    }

    public void deleteComplaint(Long id) {
        Complaint complaint = findComplaint(id);
        complaintRepository.delete(complaint);
    }

    public ComplaintResponseDTO startComplaint(Long id) {

        Complaint complaint = findComplaint(id);
        verifyAssignedTechnician(complaint);

        if (complaint.getStatus() != ComplaintStatus.ASSIGNED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only ASSIGNED complaints can be started");
        }

        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        return convertToResponseDTO(complaintRepository.save(complaint));
    }

    public ComplaintResponseDTO resolveComplaint(Long id) {

        Complaint complaint = findComplaint(id);
        verifyAssignedTechnician(complaint);

        if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only IN_PROGRESS complaints can be resolved");
        }

        complaint.setStatus(ComplaintStatus.RESOLVED);
        return convertToResponseDTO(complaintRepository.save(complaint));
    }

    public ComplaintResponseDTO verifyResolution(Long id, boolean approved) {

        Complaint complaint = findComplaint(id);

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only RESOLVED complaints can be verified");
        }

        complaint.setStatus(
                approved ? ComplaintStatus.CLOSED : ComplaintStatus.REOPENED);

        return convertToResponseDTO(complaintRepository.save(complaint));
    }

    private Complaint findComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    public List<ComplaintResponseDTO> getMyComplaints() {

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

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"));

        return complaintRepository.findByReportedById(user.getId())
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }


    private void verifyAssignedTechnician(Complaint complaint) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        ComplaintAssignment assignment =
                assignmentRepository.findByComplaintId(complaint.getId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "No technician is assigned to this complaint"));

        String loggedInEmail = authentication.getName();
        String assignedEmail = assignment.getTechnician().getEmail();

        if (assignedEmail == null
                || !assignedEmail.equalsIgnoreCase(loggedInEmail)
                || assignment.getTechnician().getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not assigned to this complaint");
        }
    }
}
