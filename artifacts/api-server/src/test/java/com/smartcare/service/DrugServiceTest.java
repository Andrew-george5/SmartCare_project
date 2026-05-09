package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Drug;
import com.smartcare.repository.DrugRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DrugService unit tests")
class DrugServiceTest {

    @Mock
    DrugRepository drugRepository;

    @InjectMocks
    DrugService drugService;

    private Drug drug1;
    private Drug drug2;

    @BeforeEach
    void setUp() {
        drug1 = Drug.builder()
                .drugId(1)
                .drugName("Amoxicillin")
                .activeIngredients(new ArrayList<>(List.of("Amoxicillin trihydrate", "Clavulanic acid")))
                .build();

        drug2 = Drug.builder()
                .drugId(2)
                .drugName("Paracetamol")
                .activeIngredients(new ArrayList<>(List.of("Acetaminophen")))
                .build();
    }

    // ── listDrugs ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("listDrugs(null) returns all drugs with correct fields")
    void listDrugs_noSearch_returnsAll() {
        when(drugRepository.findAll()).thenReturn(List.of(drug1, drug2));

        List<Map<String, Object>> result = drugService.listDrugs(null);

        assertThat(result).hasSize(2);

        Map<String, Object> first = result.get(0);
        assertThat(first).containsKey("drugId");
        assertThat(first).containsKey("drugName");
        assertThat(first).containsKey("activeIngredients");
        assertThat(first.get("drugId")).isEqualTo(1);
        assertThat(first.get("drugName")).isEqualTo("Amoxicillin");

        @SuppressWarnings("unchecked")
        List<String> ingredients = (List<String>) first.get("activeIngredients");
        assertThat(ingredients).containsExactly("Amoxicillin trihydrate", "Clavulanic acid");

        verify(drugRepository).findAll();
        verify(drugRepository, never()).findByDrugNameContainingIgnoreCase(any());
    }

    @Test
    @DisplayName("listDrugs(blank string) returns all drugs")
    void listDrugs_blankSearch_returnsAll() {
        when(drugRepository.findAll()).thenReturn(List.of(drug1, drug2));

        List<Map<String, Object>> result = drugService.listDrugs("   ");

        assertThat(result).hasSize(2);
        verify(drugRepository).findAll();
    }

    @Test
    @DisplayName("listDrugs(search term) delegates to filtered query")
    void listDrugs_withSearch_returnsFiltered() {
        when(drugRepository.findByDrugNameContainingIgnoreCase("para"))
                .thenReturn(List.of(drug2));

        List<Map<String, Object>> result = drugService.listDrugs("para");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("drugName")).isEqualTo("Paracetamol");
        verify(drugRepository).findByDrugNameContainingIgnoreCase("para");
        verify(drugRepository, never()).findAll();
    }

    @Test
    @DisplayName("listDrugs returns empty list when no drugs exist")
    void listDrugs_empty_returnsEmptyList() {
        when(drugRepository.findAll()).thenReturn(List.of());

        List<Map<String, Object>> result = drugService.listDrugs(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("listDrugs returns a plain ArrayList — not a Hibernate proxy — for activeIngredients")
    void listDrugs_activeIngredients_isPlainList() {
        when(drugRepository.findAll()).thenReturn(List.of(drug1));

        List<Map<String, Object>> result = drugService.listDrugs(null);
        Object ingredients = result.get(0).get("activeIngredients");

        assertThat(ingredients).isInstanceOf(ArrayList.class);
    }

    @Test
    @DisplayName("listDrugs drug with no active ingredients returns empty list, not null")
    void listDrugs_noIngredients_returnsEmptyList() {
        Drug plain = Drug.builder()
                .drugId(3)
                .drugName("Ibuprofen")
                .activeIngredients(new ArrayList<>())
                .build();
        when(drugRepository.findAll()).thenReturn(List.of(plain));

        List<Map<String, Object>> result = drugService.listDrugs(null);

        @SuppressWarnings("unchecked")
        List<String> ingredients = (List<String>) result.get(0).get("activeIngredients");
        assertThat(ingredients).isNotNull().isEmpty();
    }

    // ── createDrug ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createDrug saves entity and returns mapped result")
    void createDrug_savesAndReturns() {
        Map<String, Object> body = Map.of(
                "drugName", "Ibuprofen",
                "activeIngredients", List.of("Ibuprofen")
        );

        Drug saved = Drug.builder()
                .drugId(99)
                .drugName("Ibuprofen")
                .activeIngredients(new ArrayList<>(List.of("Ibuprofen")))
                .build();

        when(drugRepository.save(any(Drug.class))).thenReturn(saved);

        Map<String, Object> result = drugService.createDrug(body);

        assertThat(result.get("drugId")).isEqualTo(99);
        assertThat(result.get("drugName")).isEqualTo("Ibuprofen");

        @SuppressWarnings("unchecked")
        List<String> ingredients = (List<String>) result.get("activeIngredients");
        assertThat(ingredients).containsExactly("Ibuprofen");

        verify(drugRepository).save(any(Drug.class));
    }

    @Test
    @DisplayName("createDrug with null activeIngredients defaults to empty list")
    void createDrug_nullIngredients_usesEmptyList() {
        Map<String, Object> body = Map.of("drugName", "Aspirin");

        Drug saved = Drug.builder()
                .drugId(10)
                .drugName("Aspirin")
                .activeIngredients(new ArrayList<>())
                .build();

        when(drugRepository.save(any(Drug.class))).thenReturn(saved);

        Map<String, Object> result = drugService.createDrug(body);

        @SuppressWarnings("unchecked")
        List<String> ingredients = (List<String>) result.get("activeIngredients");
        assertThat(ingredients).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("createDrug persists the correct drug name")
    void createDrug_persistsCorrectName() {
        Map<String, Object> body = Map.of("drugName", "Metformin");

        Drug saved = Drug.builder()
                .drugId(20)
                .drugName("Metformin")
                .activeIngredients(new ArrayList<>())
                .build();

        when(drugRepository.save(any(Drug.class))).thenReturn(saved);

        Map<String, Object> result = drugService.createDrug(body);

        assertThat(result.get("drugName")).isEqualTo("Metformin");
        verify(drugRepository).save(argThat(d -> "Metformin".equals(d.getDrugName())));
    }

    // ── deleteDrug ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteDrug calls deleteById when drug exists")
    void deleteDrug_exists_deletes() {
        when(drugRepository.existsById(1)).thenReturn(true);

        drugService.deleteDrug(1);

        verify(drugRepository).existsById(1);
        verify(drugRepository).deleteById(1);
    }

    @Test
    @DisplayName("deleteDrug throws ResourceNotFoundException when drug does not exist")
    void deleteDrug_notFound_throws() {
        when(drugRepository.existsById(999)).thenReturn(false);

        assertThatThrownBy(() -> drugService.deleteDrug(999))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");

        verify(drugRepository, never()).deleteById(any());
    }
}
