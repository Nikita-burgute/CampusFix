package com.campusfix.backend.repository;

import com.campusfix.backend.entity.ComplaintAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComplaintAssignmentRepository
        extends JpaRepository<ComplaintAssignment, Long> {

    Optional<ComplaintAssignment> findByComplaintId(Long complaintId);
}