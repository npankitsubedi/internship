package com.vit.internshipapproval.controller;

import com.vit.internshipapproval.dto.ApplicationResponse;
import com.vit.internshipapproval.dto.ApplicationSubmissionRequest;
import com.vit.internshipapproval.dto.ApprovalActionRequest;
import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import com.vit.internshipapproval.service.ApplicationWorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationWorkflowService applicationWorkflowService;

    public ApplicationController(ApplicationWorkflowService applicationWorkflowService) {
        this.applicationWorkflowService = applicationWorkflowService;
    }

    @GetMapping
    public List<ApplicationResponse> listApplications(
        @RequestParam(required = false) Optional<Role> stage,
        @RequestParam(required = false) Optional<ApplicationStatus> status
    ) {
        return applicationWorkflowService.listApplications(stage, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse submitApplication(@Valid @RequestBody ApplicationSubmissionRequest request) {
        return applicationWorkflowService.submitApplication(request);
    }

    @PostMapping("/{applicationId}/approve")
    public ApplicationResponse approveApplication(
        @PathVariable UUID applicationId,
        @Valid @RequestBody ApprovalActionRequest request
    ) {
        return applicationWorkflowService.processApproval(applicationId, request);
    }
}
