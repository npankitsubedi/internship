package com.vit.internshipapproval.repository;

import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import com.vit.internshipapproval.model.Application;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    @EntityGraph(attributePaths = "approvalHistory")
    List<Application> findAllByOrderBySubmittedAtDesc();

    @EntityGraph(attributePaths = "approvalHistory")
    List<Application> findByStageOrderByUpdatedAtDesc(Role stage);

    @EntityGraph(attributePaths = "approvalHistory")
    List<Application> findByStatusOrderByUpdatedAtDesc(ApplicationStatus status);

    boolean existsByRegistrationNumber(String registrationNumber);
}
