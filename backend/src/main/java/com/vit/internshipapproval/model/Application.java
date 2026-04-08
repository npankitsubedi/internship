package com.vit.internshipapproval.model;

import com.vit.internshipapproval.enums.ApplicationStatus;
import com.vit.internshipapproval.enums.Role;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_name", nullable = false, length = 120)
    private String studentName;

    @Column(name = "registration_number", nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @Column(name = "student_email", nullable = false, length = 150)
    private String studentEmail;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 120)
    private String school;

    @Column(nullable = false, length = 120)
    private String program;

    @Column(name = "year_of_study", nullable = false)
    private Integer yearOfStudy;

    @Column(name = "earned_credits", nullable = false)
    private Integer earnedCredits;

    @Column(name = "internship_mode", nullable = false, length = 20)
    private String internshipMode;

    @Column(name = "company_name", nullable = false, length = 160)
    private String companyName;

    @Column(name = "role_title", nullable = false, length = 160)
    private String roleTitle;

    @Column(precision = 10, scale = 2)
    private BigDecimal stipend;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "location_scope", nullable = false, length = 20)
    private String locationScope;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(name = "state_name", length = 120)
    private String stateName;

    @Column(name = "global_region", length = 120)
    private String globalRegion;

    @Column(nullable = false, length = 120)
    private String country;

    @Column(name = "offer_letter_url", nullable = false, columnDefinition = "TEXT")
    private String offerLetterUrl;

    @Column(name = "email_proof_url", nullable = false, columnDefinition = "TEXT")
    private String emailProofUrl;

    @Column(name = "placement_withdrawal_accepted", nullable = false)
    private boolean placementWithdrawalAccepted;

    @Column(name = "placement_withdrawal_typed_name", length = 120)
    private String placementWithdrawalTypedName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role stage;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("actionAt ASC")
    private List<ApprovalHistory> approvalHistory = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (submittedAt == null) {
            submittedAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public String getProgram() {
        return program;
    }

    public void setProgram(String program) {
        this.program = program;
    }

    public Integer getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(Integer yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    public Integer getEarnedCredits() {
        return earnedCredits;
    }

    public void setEarnedCredits(Integer earnedCredits) {
        this.earnedCredits = earnedCredits;
    }

    public String getInternshipMode() {
        return internshipMode;
    }

    public void setInternshipMode(String internshipMode) {
        this.internshipMode = internshipMode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public BigDecimal getStipend() {
        return stipend;
    }

    public void setStipend(BigDecimal stipend) {
        this.stipend = stipend;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getLocationScope() {
        return locationScope;
    }

    public void setLocationScope(String locationScope) {
        this.locationScope = locationScope;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStateName() {
        return stateName;
    }

    public void setStateName(String stateName) {
        this.stateName = stateName;
    }

    public String getGlobalRegion() {
        return globalRegion;
    }

    public void setGlobalRegion(String globalRegion) {
        this.globalRegion = globalRegion;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getOfferLetterUrl() {
        return offerLetterUrl;
    }

    public void setOfferLetterUrl(String offerLetterUrl) {
        this.offerLetterUrl = offerLetterUrl;
    }

    public String getEmailProofUrl() {
        return emailProofUrl;
    }

    public void setEmailProofUrl(String emailProofUrl) {
        this.emailProofUrl = emailProofUrl;
    }

    public boolean isPlacementWithdrawalAccepted() {
        return placementWithdrawalAccepted;
    }

    public void setPlacementWithdrawalAccepted(boolean placementWithdrawalAccepted) {
        this.placementWithdrawalAccepted = placementWithdrawalAccepted;
    }

    public String getPlacementWithdrawalTypedName() {
        return placementWithdrawalTypedName;
    }

    public void setPlacementWithdrawalTypedName(String placementWithdrawalTypedName) {
        this.placementWithdrawalTypedName = placementWithdrawalTypedName;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public Role getStage() {
        return stage;
    }

    public void setStage(Role stage) {
        this.stage = stage;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ApprovalHistory> getApprovalHistory() {
        return approvalHistory;
    }

    public void setApprovalHistory(List<ApprovalHistory> approvalHistory) {
        this.approvalHistory = approvalHistory;
    }
}
