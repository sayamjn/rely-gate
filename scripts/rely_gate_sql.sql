USE [APARTMENT_GATE_V1.0.0_DEMO]
GO
/****** Object:  Table [dbo].[BulkVisitorUpload]    Script Date: 16-06-2025 13:11:45 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BulkVisitorUpload](
	[StudentID] [varchar](100) NULL,
	[Name] [varchar](500) NULL,
	[Mobile] [varchar](20) NULL,
	[Course] [varchar](500) NULL,
	[Hostel] [varchar](500) NULL,
	[TenantID] [varchar](50) NULL,
	[Type] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DepartmentMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DepartmentMaster](
	[DeptID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[DeptCode] [nvarchar](50) NULL,
	[DeptName] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_DepartmentMaster] PRIMARY KEY CLUSTERED 
(
	[DeptID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FCM]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FCM](
	[FirebaseID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[FCMID] [nvarchar](250) NULL,
	[AndroidID] [nvarchar](250) NULL,
	[LoginUserID] [int] NULL,
	[FlatID] [int] NULL,
	[FlatName] [nvarchar](450) NULL,
	[DeviceName] [nvarchar](250) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[Custom_3] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_FCM] PRIMARY KEY CLUSTERED 
(
	[FirebaseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlatMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlatMaster](
	[FlatID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[FlatName] [nvarchar](350) NULL,
	[FloorID] [int] NULL,
	[FloorName] [nvarchar](250) NULL,
	[BlockID] [int] NULL,
	[BlockName] [nvarchar](250) NULL,
	[OwnerFName] [nvarchar](50) NULL,
	[OwnerMName] [nvarchar](50) NULL,
	[OwnerLName] [nvarchar](50) NULL,
	[RentFlag] [nchar](1) NULL,
	[DOP] [nvarchar](50) NULL,
	[DOC] [nvarchar](50) NULL,
	[OwnerMobile] [nvarchar](50) NULL,
	[OwnerMobile_2] [nvarchar](50) NULL,
	[RenterFName] [nvarchar](50) NULL,
	[RenterMName] [nvarchar](50) NULL,
	[RenterLName] [nvarchar](50) NULL,
	[RenterMobile] [nvarchar](50) NULL,
	[Area] [decimal](18, 2) NULL,
	[FlatRemark] [nvarchar](750) NULL,
	[RentPerMonth] [decimal](18, 2) NULL,
	[SocietyFeePerMonth] [decimal](18, 2) NULL,
	[IsVacant] [nchar](1) NULL,
	[OwnerPhotoFlag] [nchar](1) NULL,
	[OwnerPhotoPath] [nvarchar](750) NULL,
	[OwnerPhoto] [nvarchar](750) NULL,
	[RenterPhotoFlag] [nchar](1) NULL,
	[RenterPhotoPath] [nvarchar](750) NULL,
	[RenterPhoto] [nvarchar](750) NULL,
	[RenterIDProofFlag] [nchar](1) NULL,
	[RentID] [int] NULL,
	[RenterIDName] [nvarchar](50) NULL,
	[NoFamilyMember] [int] NULL,
	[NoChildren] [int] NULL,
	[NoMaid] [int] NULL,
	[Remark] [nvarchar](750) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_FlatMaster] PRIMARY KEY CLUSTERED 
(
	[FlatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FloorMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FloorMaster](
	[FloorID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NOT NULL,
	[IsActive] [nchar](1) NOT NULL,
	[FloorName] [nvarchar](250) NOT NULL,
	[BlockID] [int] NULL,
	[BlockName] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_FloorMaster] PRIMARY KEY CLUSTERED 
(
	[FloorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FuctionalityMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FuctionalityMaster](
	[FuncID] [int] NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[FuctionalityName] [nvarchar](750) NULL,
	[GroupID] [int] NULL,
	[GroupName] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_FuctionalityMaster] PRIMARY KEY CLUSTERED 
(
	[FuncID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FuncRoleAccess]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FuncRoleAccess](
	[AccessID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[RoleAccessID] [int] NOT NULL,
	[FuncID] [int] NOT NULL,
	[FuctionalityName] [nvarchar](750) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
	[CustomField] [nvarchar](450) NULL,
 CONSTRAINT [PK_FuncRoleAccess] PRIMARY KEY CLUSTERED 
(
	[AccessID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IDMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IDMaster](
	[IdentityID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[IDName] [nvarchar](250) NULL,
	[IDIconFlag] [nchar](1) NULL,
	[IDIconPath] [nvarchar](750) NULL,
	[IDIconPic] [nvarchar](750) NULL,
	[Remark] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_IDMaster] PRIMARY KEY CLUSTERED 
(
	[IdentityID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ImportanceMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ImportanceMaster](
	[ImportanceID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[Importance] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_ImportanceMaster] PRIMARY KEY CLUSTERED 
(
	[ImportanceID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ImportantContact]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ImportantContact](
	[ContactID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[ContactGroupID] [int] NULL,
	[ContactGroupName] [nvarchar](50) NULL,
	[ContactGroupOrder] [int] NULL,
	[ContactName] [nvarchar](50) NULL,
	[ContactNumber] [nvarchar](50) NULL,
	[ContactDisplayOrder] [int] NULL,
	[Priority] [nvarchar](50) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_ImportantContact] PRIMARY KEY CLUSTERED 
(
	[ContactID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncidentCatMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncidentCatMaster](
	[IncidentCatID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[IncidentCatName] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_IncidentCatMaster] PRIMARY KEY CLUSTERED 
(
	[IncidentCatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncidentEntry]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncidentEntry](
	[IncidentID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[StatusName] [nvarchar](50) NULL,
	[IncidentCatID] [int] NULL,
	[IncidentCatName] [nvarchar](250) NULL,
	[IncidentSubCatID] [int] NULL,
	[IncidentSubCatName] [nvarchar](250) NULL,
	[DeptID] [int] NULL,
	[DepartName] [nvarchar](250) NULL,
	[SubDeptCode] [nvarchar](50) NULL,
	[SubDeptID] [int] NULL,
	[SubDeptName] [nvarchar](250) NULL,
	[IncNo] [nvarchar](50) NULL,
	[IncidentName] [nvarchar](750) NULL,
	[IncidentDesc] [ntext] NULL,
	[Place] [nvarchar](250) NULL,
	[IncidentDate] [datetime] NULL,
	[IncidentDateTxt] [nvarchar](50) NULL,
	[ResolveDate] [datetime] NULL,
	[ResolveDateTxt] [nvarchar](50) NULL,
	[ImportanceID] [int] NULL,
	[Importance] [nvarchar](50) NULL,
	[DurationTimeMin] [int] NULL,
	[AssignedToID] [nvarchar](20) NULL,
	[AssignedTo] [nvarchar](250) NULL,
	[ResolvedByID] [nvarchar](20) NULL,
	[ResolvedBy] [nvarchar](250) NULL,
	[LastRemark] [nvarchar](750) NULL,
	[LastRemarkByID] [nvarchar](20) NULL,
	[LastRemarkBy] [nvarchar](250) NULL,
	[PhotoFlag] [nchar](1) NULL,
	[PhotoPath_1] [nvarchar](450) NULL,
	[Photo_1] [nvarchar](450) NULL,
	[PhotoPath_2] [nvarchar](450) NULL,
	[Photo_2] [nvarchar](450) NULL,
	[PhotoPath_3] [nvarchar](450) NULL,
	[Photo_3] [nvarchar](450) NULL,
	[PhotoPath_4] [nvarchar](450) NULL,
	[Photo_4] [nvarchar](450) NULL,
	[PhotoPath_5] [nvarchar](450) NULL,
	[Photo_5] [nvarchar](450) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_IncidentEntry] PRIMARY KEY CLUSTERED 
(
	[IncidentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LoginUser]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LoginUser](
	[LoginID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[RoleAccessID] [int] NULL,
	[RoleName] [nvarchar](250) NULL,
	[FirstN] [nvarchar](100) NULL,
	[MiddleN] [nvarchar](100) NULL,
	[LastN] [nvarchar](100) NULL,
	[UserName] [nvarchar](250) NOT NULL,
	[Passwrd] [nvarchar](1000) NOT NULL,
	[DisplayN] [nvarchar](250) NULL,
	[Email] [nvarchar](150) NULL,
	[Mobile] [nvarchar](50) NULL,
	[MobileSecondary] [nvarchar](50) NULL,
	[PhotoFlag] [nchar](10) NULL,
	[PhotoPath] [nvarchar](1000) NULL,
	[Photo] [nvarchar](450) NULL,
	[LastLogin] [datetime] NULL,
	[LastPasswrdChgedDate] [datetime] NULL,
	[SharedLogin] [nchar](10) NULL,
	[LoginIP] [nvarchar](250) NULL,
	[LinkFlatFlag] [nchar](1) NULL,
	[LinkeFlatID] [nvarchar](250) NULL,
	[LinkeFlatName] [nvarchar](450) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_Login] PRIMARY KEY CLUSTERED 
(
	[LoginID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ModuleMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ModuleMaster](
	[ModuleID] [int] NOT NULL,
	[TenantID] [int] NOT NULL,
	[IsActive] [nchar](1) NOT NULL,
	[ParentMenuID] [int] NULL,
	[ModuleName] [nvarchar](450) NOT NULL,
	[MenuUrl] [nvarchar](1000) NOT NULL,
	[CusName] [nvarchar](350) NULL,
	[HomeIconFlag] [nchar](1) NULL,
	[ImageURL] [nvarchar](1000) NULL,
	[ImageHeight] [nvarchar](50) NULL,
	[Version] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[HomeIconDispOrder] [int] NULL,
	[ChildIconDisplayOrder] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_ModuleMaster] PRIMARY KEY CLUSTERED 
(
	[ModuleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notice]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notice](
	[NoticeID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[NoticeCatID] [int] NULL,
	[NoticeCategoryName] [nvarchar](50) NULL,
	[IsImportant] [nchar](1) NULL,
	[NoticeDesc] [nvarchar](750) NULL,
	[ActiveDate] [nvarchar](50) NULL,
	[DisplayTillDate] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_Notice] PRIMARY KEY CLUSTERED 
(
	[NoticeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NoticeCategoryMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NoticeCategoryMaster](
	[NoticeCatID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[NoticeCategoryName] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_NoticeCategoryMaster] PRIMARY KEY CLUSTERED 
(
	[NoticeCatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Photo]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Photo](
	[PhotoID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[PCategoryID] [int] NULL,
	[CategoryName] [nvarchar](50) NULL,
	[PhotoPath] [nvarchar](250) NULL,
	[PhotoN] [nvarchar](50) NULL,
	[Phototext] [nvarchar](250) NULL,
	[OrderNumber] [int] NULL,
	[IsCoverPhoro] [nchar](1) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_Photo] PRIMARY KEY CLUSTERED 
(
	[PhotoID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PortalOTP]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PortalOTP](
	[PPOTPID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[MobileNo] [nvarchar](20) NULL,
	[OTPNumber] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_PortalOTP] PRIMARY KEY CLUSTERED 
(
	[PPOTPID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RelationMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RelationMaster](
	[RelationCatID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[RelationName] [nvarchar](50) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[Custom_3] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_RelationMaster] PRIMARY KEY CLUSTERED 
(
	[RelationCatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReportProblem]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReportProblem](
	[ReportProblemID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[StatusName] [nvarchar](50) NULL,
	[SubjectName] [nvarchar](750) NULL,
	[Message] [nvarchar](4000) NULL,
	[CreatedDateTxt] [nvarchar](50) NULL,
	[ImportanceCatID] [int] NULL,
	[ImportanceCat] [nvarchar](50) NULL,
	[AttachFileFlag] [nchar](1) NULL,
	[AttachFileName] [nvarchar](250) NULL,
	[AttachFileLocation] [nvarchar](250) NULL,
	[ResolvedDate] [nvarchar](50) NULL,
	[ResolvedBy] [nvarchar](50) NULL,
	[ResolvedRemark] [nvarchar](750) NULL,
	[Important] [nchar](1) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](20) NULL,
	[UpdatedBy] [nvarchar](20) NULL,
 CONSTRAINT [PK_ReportProblem] PRIMARY KEY CLUSTERED 
(
	[ReportProblemID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RoleMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoleMaster](
	[RoleID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NOT NULL,
	[IsActive] [nchar](1) NOT NULL,
	[RoleCode] [nvarchar](50) NULL,
	[RoleName] [nvarchar](250) NOT NULL,
	[RoleRemark] [nvarchar](450) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_RoleMaster] PRIMARY KEY CLUSTERED 
(
	[RoleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RoleMenuMapping]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoleMenuMapping](
	[MappingID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[RoleMasterID] [int] NULL,
	[RoleName] [nvarchar](750) NULL,
	[ModuleID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[CustomField] [nvarchar](450) NULL,
 CONSTRAINT [PK_RoleMenuMapping] PRIMARY KEY CLUSTERED 
(
	[MappingID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SMSGatewayMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SMSGatewayMaster](
	[SMSGatewayID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[SMSEnabledFlag] [nchar](1) NOT NULL,
	[GatewayURL] [nvarchar](750) NULL,
	[ApiKeyFlag] [nchar](1) NULL,
	[ApiKeyName] [nvarchar](750) NULL,
	[UserName] [nvarchar](450) NULL,
	[Passwrd] [nvarchar](450) NULL,
	[SenderVendor] [nvarchar](450) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_SMSGatewayMaster] PRIMARY KEY CLUSTERED 
(
	[SMSGatewayID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StatusCodeMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StatusCodeMaster](
	[StatusID] [int] NOT NULL,
	[TenantID] [int] NOT NULL,
	[StatusCode] [nvarchar](20) NOT NULL,
	[StatusShortName] [nvarchar](50) NOT NULL,
	[StatusLongName] [nvarchar](250) NULL,
	[IsActive] [nchar](1) NULL,
	[Process] [nvarchar](50) NULL,
	[SubProcess] [nvarchar](250) NULL,
	[SubSubPro] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_StatusCodeMaster] PRIMARY KEY CLUSTERED 
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tenant]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tenant](
	[TenantID] [int] NOT NULL,
	[TenantCode] [nvarchar](1000) NULL,
	[TenantName] [nvarchar](450) NOT NULL,
	[ShortName] [nvarchar](250) NULL,
	[PAN] [nvarchar](250) NULL,
	[TIN] [nvarchar](250) NULL,
	[ServiceRef] [nvarchar](250) NULL,
	[Address1] [nvarchar](250) NULL,
	[Address2] [nvarchar](250) NULL,
	[Address3] [nvarchar](250) NULL,
	[TenantDesc] [nvarchar](750) NULL,
	[Fax] [nvarchar](250) NULL,
	[Email] [nvarchar](250) NULL,
	[VATno] [nvarchar](250) NULL,
	[DLNo] [nvarchar](250) NULL,
	[CSTNo] [nvarchar](250) NULL,
	[Lanline] [nvarchar](250) NULL,
	[Mobile] [nvarchar](250) NULL,
	[Website] [nvarchar](750) NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[SuscriptionStartDate] [datetime] NULL,
	[SuscriptionEndDate] [datetime] NULL,
	[TenantRemark] [nvarchar](750) NULL,
	[FinancialYear] [int] NULL,
	[EntityLogoFlag] [nchar](1) NULL,
	[EntityLogo] [nvarchar](750) NULL,
	[EntityLogoPath] [nvarchar](750) NULL,
	[CompanyNo] [nvarchar](50) NULL,
	[GSTNo] [nvarchar](50) NULL,
	[ServiceRegNo] [nvarchar](250) NULL,
	[RegNPrefix] [nvarchar](50) NULL,
	[MoneyRecPrefix] [nvarchar](50) NULL,
	[BillRefPrefix] [nvarchar](50) NULL,
	[KeyActivateFlag] [nchar](1) NULL,
	[ActivateDate] [datetime] NULL,
	[KeyCode] [nvarchar](450) NULL,
	[SuscriptionPlanID] [int] NULL,
	[SuscriptionPlan] [nvarchar](250) NULL,
	[PlanStartDate] [datetime] NULL,
	[PlanEndDate] [datetime] NULL,
	[MaxAllowedUnit] [int] NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[Custom_3] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
 CONSTRAINT [PK_Tenant] PRIMARY KEY CLUSTERED 
(
	[TenantID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TenantPaymentHistory]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TenantPaymentHistory](
	[TenantPayID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[TenantName] [nvarchar](450) NULL,
	[ShortName] [nvarchar](250) NULL,
	[StatusID] [int] NULL,
	[StatusName] [nvarchar](50) NULL,
	[PayNo] [nvarchar](50) NULL,
	[PayDate] [datetime] NULL,
	[PayDateTxt] [nvarchar](50) NULL,
	[BillAmt] [decimal](18, 2) NULL,
	[DiscountAmt] [decimal](18, 2) NULL,
	[NetAmount] [decimal](18, 2) NULL,
	[RecAmt] [decimal](18, 2) NULL,
	[DueAmt] [decimal](18, 2) NULL,
	[PayModeID] [int] NULL,
	[PayMode] [nvarchar](50) NULL,
	[BankID] [int] NULL,
	[BankName] [nvarchar](50) NULL,
	[BankRef] [nvarchar](50) NULL,
	[PayFeeMonth] [int] NULL,
	[PayFeeMonthTxt] [nvarchar](50) NULL,
	[PayFeeYear] [int] NULL,
	[Remark] [nvarchar](750) NULL,
	[CollectedBy] [nvarchar](250) NULL,
	[FYear] [int] NULL,
	[ReceiptPaidFlag] [nchar](1) NULL,
	[AckFlag] [nchar](1) NULL,
	[AckBy] [nvarchar](250) NULL,
	[AckDate] [nvarchar](50) NULL,
	[PublishFlag] [nchar](1) NULL,
	[AttachFileFlag] [nchar](1) NULL,
	[AttachFilePath] [nvarchar](750) NULL,
	[AttachFileName] [nvarchar](750) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](250) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
 CONSTRAINT [PK_TenantPaymentHistory] PRIMARY KEY CLUSTERED 
(
	[TenantPayID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TenantSetting]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TenantSetting](
	[SettingID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[EntityName] [nvarchar](450) NULL,
	[EntityAddress_1] [nvarchar](450) NULL,
	[EntityAddress_2] [nvarchar](450) NULL,
	[EntityAddress_3] [nvarchar](450) NULL,
	[EntityAddress_4] [nvarchar](450) NULL,
	[EntityAddress_5] [nvarchar](450) NULL,
	[EntityMobile_1] [nvarchar](50) NULL,
	[EntityMobile_2] [nvarchar](50) NULL,
	[EntityLanline_1] [nvarchar](50) NULL,
	[EntityLanline_2] [nvarchar](50) NULL,
	[EntityLogoFlag] [nchar](1) NULL,
	[EntityLogo] [nvarchar](750) NULL,
	[TIN] [nvarchar](250) NULL,
	[PAN] [nvarchar](250) NULL,
	[ServiceRegNo] [nvarchar](250) NULL,
	[IsActive] [nchar](1) NULL,
	[FinancialYearFrom] [int] NULL,
	[FinancialYearTo] [int] NULL,
	[RegNPrefix] [nvarchar](50) NULL,
	[MoneyRecPrefix] [nvarchar](50) NULL,
	[BillRefPrefix] [nvarchar](50) NULL,
	[KeyActivateFlag] [nchar](1) NULL,
	[ActivateDate] [datetime] NULL,
	[KeyCode] [nvarchar](450) NULL,
	[SuscriptionPlanID] [int] NULL,
	[SuscriptionPlan] [nvarchar](250) NULL,
	[PlanStartDate] [datetime] NULL,
	[PlanEndDate] [datetime] NULL,
	[CompanyNo] [nvarchar](50) NULL,
	[GSTNo] [nvarchar](50) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[Custom_3] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CurrencyFlag] [nchar](1) NULL,
	[CurrencyName] [nvarchar](50) NULL,
 CONSTRAINT [PK_TenantSetting] PRIMARY KEY CLUSTERED 
(
	[SettingID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorCategory]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorCategory](
	[VisitorCatID] [int] NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[VisitorCatName] [nvarchar](100) NULL,
	[VisitorCatIconFlag] [nchar](1) NULL,
	[VisitorCatIconPath] [nvarchar](750) NULL,
	[VisitorCatIcon] [nvarchar](750) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorCategory] PRIMARY KEY CLUSTERED 
(
	[VisitorCatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorMaster](
	[VisitorID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[StatusName] [nvarchar](50) NULL,
	[VisitorCatID] [int] NULL,
	[VisitorCatName] [nvarchar](100) NULL,
	[VisitorSubCatID] [int] NULL,
	[VisitorSubCatName] [nvarchar](100) NULL,
	[VisitPurposeID] [int] NULL,
	[VisitPurpose] [nvarchar](250) NULL,
	[SalutationID] [int] NULL,
	[Salutation] [nvarchar](50) NULL,
	[Fname] [nvarchar](50) NULL,
	[Mname] [nvarchar](50) NULL,
	[Lname] [nvarchar](50) NULL,
	[Mobile] [nvarchar](20) NULL,
	[OTPVerified] [nchar](1) NULL,
	[Address_1] [nvarchar](250) NULL,
	[OTPVerifiedDate] [nvarchar](50) NULL,
	[TotalVisitor] [int] NULL,
	[FlatID] [int] NULL,
	[FlatName] [nvarchar](50) NULL,
	[MeetingWithID] [int] NULL,
	[MeetingWith] [nvarchar](50) NULL,
	[LoginID] [int] NULL,
	[LoginName] [nvarchar](50) NULL,
	[VisitDate] [datetime] NULL,
	[VisitDateTxt] [nvarchar](50) NULL,
	[PhotoFlag] [nchar](1) NULL,
	[PhotoPath] [nvarchar](750) NULL,
	[PhotoName] [nvarchar](750) NULL,
	[VehiclelNo] [nvarchar](50) NULL,
	[VehiclePhotoFlag] [nchar](1) NULL,
	[VehiclePhotoPath] [nvarchar](750) NULL,
	[VehiclePhotoName] [nvarchar](750) NULL,
	[Remark] [nvarchar](250) NULL,
	[INTime] [datetime] NULL,
	[INTimeTxt] [nvarchar](50) NULL,
	[OutTime] [datetime] NULL,
	[OutTimeTxt] [nvarchar](50) NULL,
	[IsProblematic] [nchar](1) NULL,
	[ProblematicRemark] [nvarchar](750) NULL,
	[ConvertFlag] [nchar](1) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorMaster] PRIMARY KEY CLUSTERED 
(
	[VisitorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorPuposeMaster]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorPuposeMaster](
	[VisitPurposeID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[PurposeCatID] [int] NULL,
	[PurposeCatName] [nvarchar](250) NULL,
	[VisitPurpose] [nvarchar](250) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorPuposeMaster] PRIMARY KEY CLUSTERED 
(
	[VisitPurposeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorRegistration]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorRegistration](
	[VisitorRegID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[StatusID] [int] NULL,
	[StatusName] [nvarchar](50) NULL,
	[VisitorCatID] [int] NULL,
	[VisitorCatName] [nvarchar](100) NULL,
	[VisitorSubCatID] [int] NULL,
	[VisitorSubCatName] [nvarchar](100) NULL,
	[VisitorRegNo] [nvarchar](50) NULL,
	[SecurityCode] [nvarchar](250) NULL,
	[VistorName] [nvarchar](150) NULL,
	[Mobile] [nvarchar](20) NULL,
	[Email] [nvarchar](50) NULL,
	[PhotoFlag] [nchar](1) NULL,
	[PhotoPath] [nvarchar](750) NULL,
	[PhotoName] [nvarchar](750) NULL,
	[VehiclelNo] [nvarchar](50) NULL,
	[VehiclePhotoFlag] [nchar](1) NULL,
	[VehiclePhotoPath] [nvarchar](750) NULL,
	[VehiclePhotoName] [nvarchar](750) NULL,
	[Remark] [nvarchar](250) NULL,
	[IdentityID] [int] NULL,
	[IDName] [nvarchar](250) NULL,
	[IDNumber] [nvarchar](50) NULL,
	[IDPhotoFlag] [nchar](1) NULL,
	[IDPhotoPath] [nvarchar](750) NULL,
	[IDPhotoName] [nvarchar](750) NULL,
	[AssociatedFlat] [nvarchar](750) NULL,
	[AssociatedBlock] [nvarchar](750) NULL,
	[ValidityFlag] [nchar](1) NULL,
	[ValidStartDate] [datetime] NULL,
	[ValidEndDate] [datetime] NULL,
	[FlatID] [int] NULL,
	[FlatName] [nvarchar](50) NULL,
	[IsProblematic] [nchar](1) NULL,
	[ProblematicRemark] [nvarchar](750) NULL,
	[Custom_1] [nvarchar](50) NULL,
	[Custom_2] [nvarchar](50) NULL,
	[Custom_3] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorRegistration] PRIMARY KEY CLUSTERED 
(
	[VisitorRegID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorRegVisitHistory]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorRegVisitHistory](
	[RegVisitorHistoryID] [bigint] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[IsRegFlag] [nchar](1) NULL,
	[VisitorRegID] [bigint] NULL,
	[VisitorRegNo] [nvarchar](50) NULL,
	[SecurityCode] [nvarchar](250) NULL,
	[VistorName] [nvarchar](150) NULL,
	[Mobile] [nvarchar](20) NULL,
	[VehiclelNo] [nvarchar](50) NULL,
	[Remark] [nvarchar](250) NULL,
	[VisitorCatID] [int] NULL,
	[VisitorCatName] [nvarchar](100) NULL,
	[VisitorSubCatID] [int] NULL,
	[VisitorSubCatName] [nvarchar](100) NULL,
	[AssociatedFlat] [nvarchar](750) NULL,
	[AssociatedBlock] [nvarchar](750) NULL,
	[INTime] [datetime] NULL,
	[INTimeTxt] [nvarchar](50) NULL,
	[OutTime] [datetime] NULL,
	[OutTimeTxt] [nvarchar](50) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorRegVisitHistory] PRIMARY KEY CLUSTERED 
(
	[RegVisitorHistoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VisitorSubCategory]    Script Date: 16-06-2025 13:11:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VisitorSubCategory](
	[VisitorSubCatID] [int] IDENTITY(1,1) NOT NULL,
	[TenantID] [int] NULL,
	[IsActive] [nchar](1) NULL,
	[VisitorCatID] [int] NULL,
	[VisitorCatName] [nvarchar](100) NULL,
	[VisitorCatIconFlag] [nchar](1) NULL,
	[VisitorCatIconPath] [nvarchar](750) NULL,
	[VisitorCatIcon] [nvarchar](750) NULL,
	[VisitorSubCatName] [nvarchar](100) NULL,
	[VisitorSubCatIconFlag] [nchar](1) NULL,
	[VisitorSubCatIconPath] [nvarchar](750) NULL,
	[VisitorSubCatIcon] [nvarchar](750) NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[CreatedBy] [nvarchar](50) NULL,
	[UpdatedBy] [nvarchar](50) NULL,
 CONSTRAINT [PK_VisitorSubCategory] PRIMARY KEY CLUSTERED 
(
	[VisitorSubCatID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[FuncRoleAccess]  WITH CHECK ADD  CONSTRAINT [FK_FuncRoleAccess_RoleMaster] FOREIGN KEY([RoleAccessID])
REFERENCES [dbo].[RoleMaster] ([RoleID])
GO
ALTER TABLE [dbo].[FuncRoleAccess] CHECK CONSTRAINT [FK_FuncRoleAccess_RoleMaster]
GO
ALTER TABLE [dbo].[Notice]  WITH CHECK ADD  CONSTRAINT [FK_Notice_NoticeCategoryMaster] FOREIGN KEY([NoticeCatID])
REFERENCES [dbo].[NoticeCategoryMaster] ([NoticeCatID])
GO
ALTER TABLE [dbo].[Notice] CHECK CONSTRAINT [FK_Notice_NoticeCategoryMaster]
GO
ALTER TABLE [dbo].[RoleMenuMapping]  WITH CHECK ADD  CONSTRAINT [FK_RoleMenuMapping_RoleMaster] FOREIGN KEY([RoleMasterID])
REFERENCES [dbo].[RoleMaster] ([RoleID])
GO
ALTER TABLE [dbo].[RoleMenuMapping] CHECK CONSTRAINT [FK_RoleMenuMapping_RoleMaster]
GO
ALTER TABLE [dbo].[VisitorSubCategory]  WITH CHECK ADD  CONSTRAINT [FK_VisitorSubCategory_VisitorCategory] FOREIGN KEY([VisitorCatID])
REFERENCES [dbo].[VisitorCategory] ([VisitorCatID])
GO
ALTER TABLE [dbo].[VisitorSubCategory] CHECK CONSTRAINT [FK_VisitorSubCategory_VisitorCategory]
GO
