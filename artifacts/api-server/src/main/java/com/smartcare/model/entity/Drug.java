package com.smartcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "drug")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Drug {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "drug_id")
    private Integer drugId;

    @Column(name = "drug_name", nullable = false)
    private String drugName;

    @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @CollectionTable(name = "drug_ingredients", joinColumns = @JoinColumn(name = "drug_id"))
    @Column(name = "ingredient")
    @Builder.Default
    private List<String> activeIngredients = new ArrayList<>();
}
