# AI Knowledge Object Batch

Lesson: Additional Windows Tools
Lesson ID: 09
Certification: a-plus-220-1202
Source transcript: data/transcripts/cleaned/a-plus-220-1202/09-Additional Windows Tools.txt
Candidate file: data/imports/pending/09-candidates.json

## Mission
Generate clean, reviewable Knowledge Object drafts from the transcript and candidate evidence. The output should be useful for an IT learning platform, not a quiz-only app.

## Rules
- Use the transcript as evidence, but do not copy messy transcript narration.
- Prefer concise learning language.
- Keep the concept IDs stable unless a candidate is clearly wrong.
- Do not invent unsupported facts.
- Avoid duplicate objects.
- If a candidate is too broad, mark it as rejectCandidate instead of forcing content.
- Return JSON only. No markdown around the JSON.

## Required JSON Output Shape
{
  "lessonId": "09",
  "lessonTitle": "Additional Windows Tools",
  "objects": [
    {
      "id": "domain.slug",
      "title": "Human readable title",
      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system",
      "status": "draft",
      "domains": ["domain"],
      "summary": "One or two sentence learning summary.",
      "explanation": "Short explanation focused on what a learner must understand.",
      "facts": [
        { "text": "Exam-useful fact.", "importance": "exam-critical | high | medium | low", "tags": ["tag"] }
      ],
      "examples": [
        { "text": "Concrete example.", "context": "When this matters", "tags": ["tag"] }
      ],
      "relationships": {
        "related": [
          { "id": "other.knowledge-id", "reason": "Why related", "strength": "strong | medium | weak" }
        ],
        "contrastsWith": [
          { "id": "other.knowledge-id", "reason": "What differs", "strength": "strong | medium | weak" }
        ],
        "prerequisites": [],
        "parents": [],
        "children": [],
        "replacedBy": []
      },
      "assessmentSeeds": {
        "examTips": [
          { "text": "What the exam may test.", "difficulty": "easy | medium | hard", "tags": ["tag"] }
        ],
        "commonMistakes": [
          { "text": "Common learner mistake.", "difficulty": "easy | medium | hard", "tags": ["tag"] }
        ],
        "scenarios": [
          { "situation": "Scenario prompt.", "expectedAction": "Correct action or answer.", "difficulty": "easy | medium | hard", "tags": ["tag"] }
        ],
        "pbqIdeas": [
          { "task": "Possible PBQ task.", "skillsTested": ["skill"], "difficulty": "easy | medium | hard", "assetsNeeded": [] }
        ]
      },
      "sourceCandidateIds": ["CAND-001"],
      "sourceEvidenceNotes": ["Short note describing the transcript support."]
    }
  ],
  "rejectCandidates": [
    { "candidateId": "CAND-000", "title": "Title", "reason": "Why it should not become a Knowledge Object." }
  ]
}

## Candidate Concepts
## Operating System
- proposedKnowledgeId: operating-systems.operating-system
- type: operating-system
- domains: operating-systems
- quality: high (80)
- qualityFlags: transcript-like-fact: A fact sounds like transcript narration.
- currentSummary: An operating system manages hardware, runs applications, and provides the user environment for a computing device.

Current facts:
- We can see the operating system name and version.
- Under the boot option, you can decide exactly which operating system you would like to start.
- If we wanted to modify that inside of the operating system, we simply need to change the registry key and restart our computer.

Evidence snippets:
- We can see the operating system name and version.
- There's nothing inside of this program that you can change or modify, but this does provide you with a quick way to find details about this system without digging into multiple operating system utilities or different configuration parameters.
- Under the boot option, you can decide exactly which operating system you would like to start.
- There may be multiple operating systems on your computer.
- And if we wanted to modify that inside of the operating system, we simply need to change the registry key and restart our computer.

Suggested relationships:
- none

## Event Viewer
- proposedKnowledgeId: windows.event-viewer
- type: tool
- domains: windows, software-troubleshooting
- quality: high (100)
- qualityFlags: none
- currentSummary: Lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Current facts:
- Lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Evidence snippets:
- And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Suggested relationships:
- windows.windows | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.
- windows.task-manager | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

## Kernel
- proposedKnowledgeId: operating-systems.kernel
- type: concept
- domains: operating-systems
- quality: high (100)
- qualityFlags: none
- currentSummary: A kernel is the core part of an operating system that helps manage hardware and system resources.

Current facts:
- A kernel is the core part of an operating system.
- That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

Evidence snippets:
- That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

Suggested relationships:
- windows.services | related_to | That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

## Registry Editor
- proposedKnowledgeId: windows.registry-editor
- type: tool
- domains: windows
- quality: high (100)
- qualityFlags: none
- currentSummary: When you first start the registry editor, user account control recognizes that this is a utility that can make some significant changes to your system.

Current facts:
- When you first start the registry editor, user account control recognizes that this is a utility that can make some significant changes to your system.

Evidence snippets:
- When you first start the registry editor, user account control recognizes that this is a utility that can make some significant changes to your system.
- When you first start the registry editor, it's completely blank in the main menu and you have a number of different folders that you can expand on the left side.

Suggested relationships:
- none

## Services
- proposedKnowledgeId: windows.services
- type: service
- domains: windows, software-troubleshooting
- quality: high (100)
- qualityFlags: none
- currentSummary: The services tab is another way that we can look at all of the services that begin when this computer is starting up and we can decide how this service will run when we start our computer.

Current facts:
- The services tab is another way that we can look at all of the services that begin when this computer is starting up and we can decide how this service will run when we start our computer.
- That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

Evidence snippets:
- and details about services, program groups, and other software information.
- And this overview page separates it out by CPU, disk, network, and you can see a breakdown of individual services running in each of those separate categories.
- You have general, boot, services, startup, and tools.
- The services tab is another way that we can look at all of the services that begin when this computer is starting up and we can decide how this service will run when we start our computer.
- That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

Suggested relationships:
- operating-systems.kernel | related_to | That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

## Task Manager
- proposedKnowledgeId: windows.task-manager
- type: tool
- domains: windows, software-troubleshooting
- quality: high (100)
- qualityFlags: none
- currentSummary: This used to be a separate part of the system configuration utility and now that function is built into our task manager.

Current facts:
- This used to be a separate part of the system configuration utility and now that function is built into our task manager.
- Lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Evidence snippets:
- In previous videos, we've looked at the real-time analysis available inside of Task Manager and the long-term analysis that's available inside of performance monitor.
- This used to be a separate part of the system configuration utility and now that function is built into our task manager.
- And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Suggested relationships:
- windows.windows | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.
- windows.event-viewer | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

## Windows
- proposedKnowledgeId: windows.windows
- type: operating-system
- domains: windows, operating-systems
- quality: high (100)
- qualityFlags: none
- currentSummary: Windows is Microsoft's desktop operating system used for running applications and managing hardware and system tools.

Current facts:
- Windows is a Microsoft operating system.
- There are a lot of system drivers on your Windows computer.
- The process for starting Windows is very similar across multiple systems.
- There's also a lot of customization that you can do with what happens behind the scenes when Windows is starting up.
- Under the general tab, you can select how Windows will start up, whether it's a normal startup, one that uses diagnostics, or you can specify exactly what loads during the startup process.
- Lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Evidence snippets:
- And there are a lot of system drivers on your Windows computer.
- The process for starting Windows is very similar across multiple systems.
- You power on the computer, you can see a splash screen for Windows pop up, and then there's usually a login prompt.
- There's also a lot of customization that you can do with what happens behind the scenes when Windows is starting up.
- Under the general tab, you can select how Windows will start up, whether it's a normal startup, one that uses diagnostics, or you can specify exactly what loads during the startup process.

Suggested relationships:
- windows.task-manager | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.
- windows.event-viewer | contrasts_with | And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

## Cleaned Transcript
When you're troubleshooting a computer, it's common to sit down at a machine that you've never seen before and be expected to know everything there is to know about the internals of that device.

One of the ways that you can get a quick overview of this device configuration is by running the system information utility.

If you'd like to do this quickly, you can simply run MSinfo 32.exe.

32.exe.

The first is hardware resources where we can view how much memory is in the system, what DMA settings have been configured, any interrupts, and any conflicts with any of those settings.

We also have a section for components.

So, if you'd like to see what the display settings and network configurations are, you can find them under that category.

And lastly, we have software environment, which shows us what drivers are installed, any print jobs that may be pending, and any running tasks that are configured in our system.

Here is the system information utility on my computer and you can see those three categories for hardware resources, components, and software environment.

Before we get into those categories though, you'll notice there is a system summary which gives us a nice overview of how this system is configured.

We can see the operating system name and version.

We can identify processor details, the BIOS config.

We know exactly what device is the boot device from here.

And we can see information about the available memory and file space on this computer.

Under the hardware resources, let's click the plus sign to expand this section.

You can see information about any conflicts or sharing problems that we have on this computer.

None are listed on my current device.

Any DMA or direct memory access devices, nothing there.

We got forced hardware, IO settings, IRQs for interrupts, and then the memory configuration on this computer.

Under the components category, there are a number of different options available.

For example, you can view sound device information.

We'll expand the network settings to view the adapter, the protocol, and the Windock details.

You can also view storage information from here.

There's information about the drives on your system, the detailed disk information, and any other IDE or information about a SATA drive.

And at the bottom, we have software environment.

Let's expand that category.

And we can see information about our system drivers.

And there are a lot of system drivers on your Windows computer.

Information about any print jobs that may be pending.

We currently have no print jobs in our queue.

and details about services, program groups, and other software information.

There's nothing inside of this program that you can change or modify, but this does provide you with a quick way to find details about this system without digging into multiple operating system utilities or different configuration parameters.

parameters.

In previous videos, we've looked at the real-time analysis available inside of Task Manager and the long-term analysis that's available inside of performance monitor.

There's also a utility called resource monitor that combines that realtime view with detailed statistics.

You can see this listed as CPU, disk, network, and other categories.

You can see that this shows an overview of how your system is performing.

CPU information, memory categories, disk and network.

If you want to run resource monitor, you can simply choose that from your search option or you can type in restmon res.exe.

As you can see, there is a lot of detail available inside of resource monitor.

And this overview page separates it out by CPU, disk, network, and you can see a breakdown of individual services running in each of those separate categories.

If you want a more detailed view of each of those categories, you can choose that option on the top tabs to break down information about the individual CPUs and how they're performing, information about the memory used inside of your system, how much drive or storage information is being utilized at this moment, and information about how much of our network we're using.

If you're trying to get detailed information about a specific application and what it may be using with a specific resource, you're able to view that inside of resource resource monitor.

The process for starting Windows is very similar across multiple systems.

You power on the computer, you can see a splash screen for Windows pop up, and then there's usually a login prompt.

There's also a lot of customization that you can do with what happens behind the scenes when Windows is starting up.

And one easy way to set these parameters is by using system configuration.

You can either search for system configuration or you can simply start msconfig.exe.

There are a number of tabs available inside of system configuration.

You have general, boot, services, startup, and tools.

Under the general tab, you can select how Windows will start up, whether it's a normal startup, one that uses diagnostics, or you can specify exactly what loads during the startup process.

Under the boot option, you can decide exactly which operating system you would like to start.

There may be multiple operating systems on your computer.

You can choose safe boot from this option and choose what type of safe boot you would like to use.

Or you can change different options.

For example, you can get rid of the graphical user interface when it's booting.

You can create a log during the boot process and other detailed boot options.

The services tab is another way that we can look at all of the services that begin when this computer is starting up and we can decide how this service will run when we start our computer.

There's also a startup tab that does a similar process for the individual applications that load when you log in.

This used to be a separate part of the system configuration utility and now that function is built into our task manager.

And lastly, there is the tools tab where you can launch different utilities available inside of Windows such as the event viewer, internet options, task manager, resource monitor, and many more.

Our computers never seem to have enough storage space on our hard drives and our SSDs.

One way that you can easily clean out these drives is by running disk cleanup.

This is a quick way to categorize the type of data that is stored on your system and be able to easily and safely delete information that you no longer need.

You can see there are a number of categories already predefined within disc cleanup such as downloaded program files, temporary internet files, Windows error reports, and other categories.

A quick way to start disc cleanup is running clean mgr.exe.

When we start looking at disc cleanup, you can see the different areas where you might select files.

Things like downloaded program files, temporary internet files, recycle bin, and temporary files themselves.

Notice on this computer, we have 1.56 GB of temporary files on this computer.

If I select that category, you can see it changes at the bottom how much disk space we're going to free up.

and we can free up 1.58 with the different settings that I've selected here.

We will click okay to perform that.

It tells us, are you sure you want to permanently delete these files?

And we will click yes to go through the process of finding all of these files and deleting them from our storage storage drives.

If you have a Windows computer that's using a traditional spinning hard drive, then you might want to look into the defrag utility.

This stands for disk defragmentation.

Whenever we're storing files onto our drives, it keeps the files separated into different sections.

One way that you can improve the read and write performance of your system is by taking all of those different fragments of files and bring them back together into one contiguous format.

I mentioned spinning hard drives because if you're using an SSD or solid state drive, there's no need to perform a disk defragmentation.

An SSD is able to access all of these file fragments without having to wait for a delay as a disc spins underneath.

This means that we don't need to do any type of disc defragmentation if we're using an SSD.

If you go into the drive properties, you can run a graphical frontend for disc defragmentation where you can simply use the Windows graphical interface to select the options you would like and to perform the defragmentation.

You can also perform this at the command line using the defrag command and specifying the volume that you would like to use for the def fragmentation.

Here's the graphical front end of the defrag utility.

You can see that it has performed an analysis of this drive and finds that 98% of the space is efficient.

We probably do not need to perform a def fragmentation at 98%.

But if you really wanted to get that extra 2% out of that system, you could click the optimize button to perform the defragmentation.

This performs an update on my system every week.

It analyzes and optimizes anything that may need to be changed.

But if you'd like to modify that, there's an option within the utility to change all of those configuration settings.

When you save configuration options for an application, you may be wondering where Windows stores all of those details.

Windows stores that information and so much more within the Windows registry.

And you can view and edit the Windows registry by using the regggedit.exe regggedit.exe utility.

If you start looking around inside of your registry, you'll see there is a lot of information to go through.

That's because information is stored here about the kernel, the services, the applications you're using, and so much more.

Because this is such a critical resource for Windows, it's very important that you don't make any changes without knowing exactly what you're doing.

And it's always a good idea to back up that portion of the registry before making any changes so that you can easily revert back to the previous configuration.

When you first start the registry editor, user account control recognizes that this is a utility that can make some significant changes to your system.

So, it confirms that you really do want this app to make changes to this device.

And we will choose yes.

When you first start the registry editor, it's completely blank in the main menu and you have a number of different folders that you can expand on the left side.

Each of these folders starts with the word H key and that stands for handle to registry key.

The different categories are for classes root, current user, local machine, users, and current config.

Let's look into one of these categories.

We'll go to HQ local machine.

This is a popular one.

We'll choose the software option.

We'll also choose the Microsoft option.

Let's scroll all the way down to the bottom where the Windows options might be.

We'll expand out Windows and the one that I'd like to see is all of the options underneath current version.

These are the individual registry entries.

You can see the entries have a name, a type, and the data associated with those.

For example, we can see that information about your common files are stored in a program files common files.

And if we wanted to modify that inside of the operating system, we simply need to change the registry key and restart our computer.

I also mentioned that before we make changes in the registry, it might be a good idea to back these up.

So under the file pulld down menu, there's an option to export a registry key or section of a registry key, which is referred to as a hive.

We will select what we would like to change whether it's the entire registry or a registry hive and then we can save that as separate files either on this computer or a separate storage drive.

If later on you need to restore that information that you've saved, you can simply run that registry file and it will rewrite that information back into your registry.
