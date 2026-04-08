package com.vit.internshipapproval.dto;

import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import com.vit.internshipapproval.model.ApprovalHistory;
import java.time.LocalDateTime;
import java.util.UUID;

public record ApprovalHistoryResponse(
    UUID id,
    Role actorRole,
    String actorName,
    String action,
    String comments,
    Role fromStage,
    Role toStage,
    ApplicationStatus previousStatus,
    ApplicationStatus newStatus,
    LocalDateTime actionAt
) {
    public static ApprovalHistoryResponse fromEntity(ApprovalHistory approvalHistory) {
        return new ApprovalHistoryResponse(
            approvalHistory.getId(),
            approvalHistory.getActorRole(),
            approvalHistory.getActorName(),
            approvalHistory.getAction(),
            approvalHistory.getComments(),
            approvalHistory.getFromStage(),
            approvalHistory.getToStage(),
            approvalHistory.getPreviousStatus(),
            approvalHistory.getNewStatus(),
            approvalHistory.getActionAt()
        );
    }
}
