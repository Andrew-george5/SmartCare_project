package com.smartcare.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcare.exception.GlobalExceptionHandler;
import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.security.JwtAuthFilter;
import com.smartcare.service.DrugService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer tests for DrugController.
 * - JwtAuthFilter is mocked (prevents loading JwtUtil/UserDetailsService dependencies)
 *   and configured to pass every request straight through the chain.
 * - TestSecurityConfig makes security permit all, so we focus on controller logic.
 */
@WebMvcTest(controllers = DrugController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@DisplayName("DrugController web layer tests")
class DrugControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    DrugService drugService;

    @MockBean
    JwtAuthFilter jwtAuthFilter;

    @BeforeEach
    void makeFilterPassThrough() throws Exception {
        // By default Mockito voids doFilter, stopping the chain.
        // We configure it to delegate so requests actually reach the controller.
        doAnswer((Answer<Void>) inv -> {
            ((FilterChain) inv.getArgument(2))
                    .doFilter((ServletRequest) inv.getArgument(0),
                              (ServletResponse) inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }

    // ── GET /drugs ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /drugs returns 200 with all drugs when no search param")
    void getDrugs_noSearch_returns200() throws Exception {
        List<Map<String, Object>> drugs = List.of(
                drug(1, "Amoxicillin", List.of("Amoxicillin trihydrate")),
                drug(2, "Paracetamol", List.of("Acetaminophen"))
        );
        when(drugService.listDrugs(null)).thenReturn(drugs);

        mockMvc.perform(get("/drugs"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].drugId").value(1))
                .andExpect(jsonPath("$[0].drugName").value("Amoxicillin"))
                .andExpect(jsonPath("$[0].activeIngredients[0]").value("Amoxicillin trihydrate"))
                .andExpect(jsonPath("$[1].drugId").value(2))
                .andExpect(jsonPath("$[1].drugName").value("Paracetamol"));

        verify(drugService).listDrugs(null);
    }

    @Test
    @DisplayName("GET /drugs?search=para passes search term to service and returns filtered list")
    void getDrugs_withSearch_returnsFiltered() throws Exception {
        when(drugService.listDrugs("para"))
                .thenReturn(List.of(drug(2, "Paracetamol", List.of("Acetaminophen"))));

        mockMvc.perform(get("/drugs").param("search", "para"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].drugName").value("Paracetamol"));

        verify(drugService).listDrugs("para");
    }

    @Test
    @DisplayName("GET /drugs returns empty JSON array when no drugs exist")
    void getDrugs_empty_returns200EmptyArray() throws Exception {
        when(drugService.listDrugs(null)).thenReturn(List.of());

        mockMvc.perform(get("/drugs"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /drugs serializes activeIngredients as a JSON array with all items")
    void getDrugs_activeIngredients_isJsonArray() throws Exception {
        when(drugService.listDrugs(null)).thenReturn(List.of(
                drug(1, "Amoxicillin", List.of("Amoxicillin trihydrate", "Clavulanic acid"))
        ));

        mockMvc.perform(get("/drugs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activeIngredients").isArray())
                .andExpect(jsonPath("$[0].activeIngredients.length()").value(2))
                .andExpect(jsonPath("$[0].activeIngredients[0]").value("Amoxicillin trihydrate"))
                .andExpect(jsonPath("$[0].activeIngredients[1]").value("Clavulanic acid"));
    }

    @Test
    @DisplayName("GET /drugs for drug with no ingredients returns empty array")
    void getDrugs_noIngredients_returnsEmptyArray() throws Exception {
        when(drugService.listDrugs(null)).thenReturn(List.of(
                drug(5, "Aspirin", List.of())
        ));

        mockMvc.perform(get("/drugs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activeIngredients").isArray())
                .andExpect(jsonPath("$[0].activeIngredients.length()").value(0));
    }

    // ── POST /drugs ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /drugs with valid body returns 201 with the created drug")
    void postDrugs_validBody_returns201() throws Exception {
        Map<String, Object> created = drug(15, "Ibuprofen", List.of("Ibuprofen"));
        when(drugService.createDrug(any())).thenReturn(created);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("drugName", "Ibuprofen");
        requestBody.put("activeIngredients", List.of("Ibuprofen"));

        mockMvc.perform(post("/drugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.drugId").value(15))
                .andExpect(jsonPath("$.drugName").value("Ibuprofen"))
                .andExpect(jsonPath("$.activeIngredients[0]").value("Ibuprofen"));

        verify(drugService).createDrug(any());
    }

    @Test
    @DisplayName("POST /drugs with multiple active ingredients returns all of them")
    void postDrugs_multipleIngredients_returnsAll() throws Exception {
        Map<String, Object> created = drug(16, "Augmentin",
                List.of("Amoxicillin trihydrate", "Clavulanic acid"));
        when(drugService.createDrug(any())).thenReturn(created);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("drugName", "Augmentin");
        requestBody.put("activeIngredients", List.of("Amoxicillin trihydrate", "Clavulanic acid"));

        mockMvc.perform(post("/drugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.activeIngredients.length()").value(2))
                .andExpect(jsonPath("$.activeIngredients[1]").value("Clavulanic acid"));
    }

    @Test
    @DisplayName("POST /drugs with empty activeIngredients list returns 201 with empty array")
    void postDrugs_emptyIngredients_returns201() throws Exception {
        Map<String, Object> created = drug(17, "Aspirin", List.of());
        when(drugService.createDrug(any())).thenReturn(created);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("drugName", "Aspirin");
        requestBody.put("activeIngredients", List.of());

        mockMvc.perform(post("/drugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.drugName").value("Aspirin"))
                .andExpect(jsonPath("$.activeIngredients").isArray())
                .andExpect(jsonPath("$.activeIngredients.length()").value(0));
    }

    // ── DELETE /drugs/{id} ─────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /drugs/{id} returns 204 No Content when drug exists")
    void deleteDrug_exists_returns204() throws Exception {
        doNothing().when(drugService).deleteDrug(1);

        mockMvc.perform(delete("/drugs/1"))
                .andExpect(status().isNoContent());

        verify(drugService).deleteDrug(1);
    }

    @Test
    @DisplayName("DELETE /drugs/{id} returns 404 when drug is not found")
    void deleteDrug_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Drug not found: 999"))
                .when(drugService).deleteDrug(999);

        mockMvc.perform(delete("/drugs/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /drugs/{id} returns 4xx when id is not a number")
    void deleteDrug_wrongIdType_returns4xx() throws Exception {
        mockMvc.perform(delete("/drugs/not-a-number"))
                .andExpect(status().is4xxClientError());

        verify(drugService, never()).deleteDrug(any());
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private static Map<String, Object> drug(int id, String name, List<String> ingredients) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("drugId", id);
        m.put("drugName", name);
        m.put("activeIngredients", new ArrayList<>(ingredients));
        return m;
    }
}
