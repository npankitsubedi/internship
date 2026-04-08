package com.vit.internshipapproval.repository;

import com.vit.internshipapproval.model.ApprovalHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByApplicationIdOrderByActionAtAsc(UUID applicationId);
}
