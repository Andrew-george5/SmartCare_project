package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Drug;
import com.smartcare.repository.DrugRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DrugService {

    private final DrugRepository drugRepository;

    public List<Map<String, Object>> listDrugs(String search) {
        List<Drug> drugs = (search != null && !search.isBlank())
                ? drugRepository.findByDrugNameContainingIgnoreCase(search)
                : drugRepository.findAll();
        return drugs.stream().map(this::mapDrug).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createDrug(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ingredients = (List<String>) body.get("activeIngredients");
        Drug d = Drug.builder()
                .drugName((String) body.get("drugName"))
                .activeIngredients(ingredients != null ? ingredients : List.of())
                .build();
        return mapDrug(drugRepository.save(d));
    }

    @Transactional
    public void deleteDrug(Integer id) {
        if (!drugRepository.existsById(id)) {
            throw new ResourceNotFoundException("Drug not found: " + id);
        }
        drugRepository.deleteById(id);
    }

    private Map<String, Object> mapDrug(Drug d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("drugId", d.getDrugId());
        m.put("drugName", d.getDrugName());
        m.put("activeIngredients", new java.util.ArrayList<>(d.getActiveIngredients()));
        return m;
    }
}
