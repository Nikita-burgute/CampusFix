package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintRequestDTO;
import com.campusfix.backend.dto.ComplaintResponseDTO;
import com.campusfix.backend.dto.ComplaintUpdateDTO;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.entity.Equipment;
import com.campusfix.backend.entity.Location;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.enums.ComplaintStatus;
import com.campusfix.backend.repository.ComplaintRepository;
import com.campusfix.backend.repository.EquipmentRepository;
import com.campusfix.backend.repository.LocationRepository;
import com.campusfix.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final EquipmentRepository equipmentRepository;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            LocationRepository locationRepository,
            EquipmentRepository equipmentRepository) {

        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.equipmentRepository = equipmentRepository;
    }
    public Complaint createComplaint(ComplaintRequestDTO request) {

        User user = userRepository.findById(request.getReportedById()).orElse(null);
        Location location = locationRepository.findById(request.getLocationId()).orElse(null);
        Equipment equipment = equipmentRepository.findById(request.getEquipmentId()).orElse(null);

        Complaint complaint = new Complaint();

        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(request.getPriority());

        complaint.setStatus(ComplaintStatus.REPORTED);

        complaint.setReportedBy(user);
        complaint.setLocation(location);
        complaint.setEquipment(equipment);

        return complaintRepository.save(complaint);
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

        Complaint complaint = complaintRepository.findById(id).orElse(null);

        if (complaint == null) {
            return null;
        }

        return convertToResponseDTO(complaint);
    }

    public List<ComplaintResponseDTO> getAllComplaintResponses() {

        List<Complaint> complaints = complaintRepository.findAll();

        return complaints.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public ComplaintResponseDTO updateComplaint(
            Long id,
            ComplaintUpdateDTO request) {

        Complaint complaint =
                complaintRepository.findById(id).orElse(null);

        if (complaint == null) {
            return null;
        }

        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setStatus(request.getStatus());
        complaint.setPriority(request.getPriority());

        Complaint updatedComplaint =
                complaintRepository.save(complaint);

        return convertToResponseDTO(updatedComplaint);
    }

    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }
}