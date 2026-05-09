package com.smartcare.repository;

import com.smartcare.model.entity.Drug;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DrugRepository extends JpaRepository<Drug, Integer> {
    List<Drug> findByDrugNameContainingIgnoreCase(String name);
}
