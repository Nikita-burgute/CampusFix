package com.campusfix.backend.service;

import com.campusfix.backend.entity.Equipment;
import com.campusfix.backend.repository.EquipmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public Equipment createEquipment(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id).orElse(null);
    }

    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {

        Equipment existingEquipment = equipmentRepository.findById(id).orElse(null);

        if (existingEquipment == null) {
            return null;
        }

        existingEquipment.setName(updatedEquipment.getName());
        existingEquipment.setType(updatedEquipment.getType());
        existingEquipment.setDescription(updatedEquipment.getDescription());
        existingEquipment.setLocation(updatedEquipment.getLocation());

        return equipmentRepository.save(existingEquipment);
    }

    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}