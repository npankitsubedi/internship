package com.vit.internshipapproval.dto;

import com.vit.internshipapproval.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ApprovalActionRequest(
    @NotNull(message = "Role is required")
    Role role,

    @NotBlank(message = "Approver name is required")
    String approverName,

    String comments,

    @NotNull(message = "Approval decision is required")
    Boolean approved
) {
}
