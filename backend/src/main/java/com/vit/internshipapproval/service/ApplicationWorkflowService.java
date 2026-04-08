package com.vit.internshipapproval.service;

import com.vit.internshipapproval.dto.ApplicationResponse;
import com.vit.internshipapproval.dto.ApplicationSubmissionRequest;
import com.vit.internshipapproval.dto.ApprovalActionRequest;
import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import com.vit.internshipapproval.model.Application;
import com.vit.internshipapproval.model.ApprovalHistory;
import com.vit.internshipapproval.repository.ApplicationRepository;
import com.vit.internshipapproval.repository.ApprovalHistoryRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationWorkflowService {

    private static final String CDC_MODE = "CDC";
    private static final String NON_CDC_MODE = "NON_CDC";
    private static final String INDIA_SCOPE = "INDIA";
    private static final String OUTSIDE_INDIA_SCOPE = "OUTSIDE_INDIA";
    private static final int HOD_MINIMUM_CREDITS = 75;

    private final ApplicationRepository applicationRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;

    public ApplicationWorkflowService(
        ApplicationRepository applicationRepository,
        ApprovalHistoryRepository approvalHistoryRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.approvalHistoryRepository = approvalHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listApplications(Optional<Role> stage, Optional<ApplicationStatus> status) {
        List<Application> applications;

        if (stage.isPresent()) {
            applications = applicationRepository.findByStageOrderByUpdatedAtDesc(stage.get());
        } else if (status.isPresent()) {
            applications = applicationRepository.findByStatusOrderByUpdatedAtDesc(status.get());
        } else {
            applications = applicationRepository.findAllByOrderBySubmittedAtDesc();
        }

        return applications.stream()
            .filter(application -> status.map(value -> application.getStatus() == value).orElse(true))
            .sorted(Comparator.comparing(Application::getUpdatedAt).reversed())
            .map(ApplicationResponse::fromEntity)
            .toList();
    }

    @Transactional
    public ApplicationResponse submitApplication(ApplicationSubmissionRequest request) {
        validateSubmissionRequest(request);

        String normalizedRegistrationNumber = request.registrationNumber().trim().toUpperCase(Locale.ROOT);

        if (applicationRepository.existsByRegistrationNumber(normalizedRegistrationNumber)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An application already exists for registration number " + normalizedRegistrationNumber
            );
        }

        Application application = new Application();
        application.setStudentName(request.studentName().trim());
        application.setRegistrationNumber(normalizedRegistrationNumber);
        application.setStudentEmail(request.studentEmail().trim().toLowerCase(Locale.ROOT));
        application.setPhoneNumber(request.phoneNumber().trim());
        application.setSchool(request.school().trim());
        application.setProgram(request.program().trim());
        application.setYearOfStudy(request.yearOfStudy());
        application.setEarnedCredits(request.earnedCredits());
        application.setInternshipMode(normalizeInternshipMode(request.internshipMode()));
        application.setCompanyName(request.companyName().trim());
        application.setRoleTitle(request.roleTitle().trim());
        application.setStipend(request.stipend());
        application.setStartDate(request.startDate());
        application.setEndDate(request.endDate());
        application.setLocationScope(normalizeLocationScope(request.locationScope()));
        application.setCity(request.city().trim());
        application.setStateName(cleanNullable(request.stateName()));
        application.setGlobalRegion(cleanNullable(request.globalRegion()));
        application.setCountry(request.country().trim());
        application.setOfferLetterUrl(request.offerLetterUrl().trim());
        application.setEmailProofUrl(request.emailProofUrl().trim());
        application.setPlacementWithdrawalAccepted(Boolean.TRUE.equals(request.placementWithdrawalAccepted()));
        application.setPlacementWithdrawalTypedName(cleanNullable(request.placementWithdrawalTypedName()));
        application.setStatus(ApplicationStatus.PENDING);
        application.setStage(Role.CDC);
        application.setSubmittedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        Application savedApplication = applicationRepository.save(application);
        saveHistory(
            savedApplication,
            Role.STUDENT,
            savedApplication.getStudentName(),
            "SUBMITTED",
            buildSubmissionComment(savedApplication),
            Role.STUDENT,
            Role.CDC,
            null,
            ApplicationStatus.PENDING
        );

        return ApplicationResponse.fromEntity(savedApplication);
    }

    @Transactional
    public ApplicationResponse processApproval(UUID applicationId, ApprovalActionRequest request) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only pending applications can be processed"
            );
        }

        if (application.getStage() != request.role()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only the current stage role can approve this application. Current stage: " + application.getStage()
            );
        }

        Role currentStage = application.getStage();
        ApplicationStatus previousStatus = application.getStatus();
        String cleanComments = cleanNullable(request.comments());

        if (!Boolean.TRUE.equals(request.approved())) {
            application.setStatus(ApplicationStatus.REJECTED);
            applicationRepository.save(application);
            saveHistory(
                application,
                request.role(),
                request.approverName().trim(),
                "REJECTED",
                cleanComments,
                currentStage,
                null,
                previousStatus,
                ApplicationStatus.REJECTED
            );
            return ApplicationResponse.fromEntity(application);
        }

        if (currentStage == Role.HOD && !passesHodCreditValidation(application)) {
            application.setStatus(ApplicationStatus.REJECTED);
            applicationRepository.save(application);

            String validationMessage =
                "Rejected during mock HoD credit validation. Minimum required credits: " + HOD_MINIMUM_CREDITS + ".";

            saveHistory(
                application,
                request.role(),
                request.approverName().trim(),
                "REJECTED",
                cleanComments == null ? validationMessage : cleanComments + " " + validationMessage,
                currentStage,
                null,
                previousStatus,
                ApplicationStatus.REJECTED
            );
            return ApplicationResponse.fromEntity(application);
        }

        Role nextStage = determineNextStage(application.getInternshipMode(), currentStage);
        if (nextStage == null) {
            application.setStatus(ApplicationStatus.APPROVED);
        } else {
            application.setStage(nextStage);
        }
        applicationRepository.save(application);

        saveHistory(
            application,
            request.role(),
            request.approverName().trim(),
            "APPROVED",
            cleanComments,
            currentStage,
            nextStage,
            previousStatus,
            nextStage == null ? ApplicationStatus.APPROVED : ApplicationStatus.PENDING
        );

        return ApplicationResponse.fromEntity(application);
    }

    private void validateSubmissionRequest(ApplicationSubmissionRequest request) {
        if (request.endDate().isBefore(request.startDate()) || request.endDate().isEqual(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be after the start date");
        }

        String internshipMode = normalizeInternshipMode(request.internshipMode());
        String locationScope = normalizeLocationScope(request.locationScope());

        if (INDIA_SCOPE.equals(locationScope)) {
            if (isBlank(request.stateName())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "State is required for internships in India");
            }
            if (!"India".equalsIgnoreCase(request.country().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Country must be India when location scope is INDIA");
            }
        } else {
            if (isBlank(request.globalRegion())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Global region is required for internships outside India"
                );
            }
            if ("India".equalsIgnoreCase(request.country().trim())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Country cannot be India when location scope is OUTSIDE_INDIA"
                );
            }
        }

        if (NON_CDC_MODE.equals(internshipMode)) {
            if (!Boolean.TRUE.equals(request.placementWithdrawalAccepted())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Non-CDC internships require placement withdrawal acknowledgement"
                );
            }
            String typedName = cleanNullable(request.placementWithdrawalTypedName());
            if (typedName == null || !typedName.equals(request.studentName().trim())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "For Non-CDC internships, the typed legal name must match the student name exactly"
                );
            }
        }
    }

    private Role determineNextStage(String internshipMode, Role currentStage) {
        return switch (currentStage) {
            case CDC -> CDC_MODE.equals(internshipMode) ? Role.SW : Role.GUIDE;
            case GUIDE -> Role.HOD;
            case HOD -> Role.SW;
            case SW -> Role.HOSTEL;
            case HOSTEL -> null;
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Workflow cannot be advanced from stage " + currentStage
            );
        };
    }

    private boolean passesHodCreditValidation(Application application) {
        return application.getEarnedCredits() >= HOD_MINIMUM_CREDITS;
    }

    private void saveHistory(
        Application application,
        Role actorRole,
        String actorName,
        String action,
        String comments,
        Role fromStage,
        Role toStage,
        ApplicationStatus previousStatus,
        ApplicationStatus newStatus
    ) {
        ApprovalHistory history = new ApprovalHistory();
        history.setApplication(application);
        history.setActorRole(actorRole);
        history.setActorName(actorName);
        history.setAction(action);
        history.setComments(comments);
        history.setFromStage(fromStage);
        history.setToStage(toStage);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setActionAt(LocalDateTime.now());
        approvalHistoryRepository.save(history);
        application.getApprovalHistory().add(history);
    }

    private String buildSubmissionComment(Application application) {
        if (NON_CDC_MODE.equals(application.getInternshipMode())) {
            return "Non-CDC internship submitted with placement withdrawal declaration.";
        }
        return "CDC internship submitted for approval.";
    }

    private String normalizeInternshipMode(String internshipMode) {
        String normalized = internshipMode == null ? "" : internshipMode.trim().toUpperCase(Locale.ROOT);
        if (!CDC_MODE.equals(normalized) && !NON_CDC_MODE.equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Internship mode must be CDC or NON_CDC");
        }
        return normalized;
    }

    private String normalizeLocationScope(String locationScope) {
        String normalized = locationScope == null ? "" : locationScope.trim().toUpperCase(Locale.ROOT);
        if (!INDIA_SCOPE.equals(normalized) && !OUTSIDE_INDIA_SCOPE.equals(normalized)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Location scope must be INDIA or OUTSIDE_INDIA"
            );
        }
        return normalized;
    }

    private String cleanNullable(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
