const API_URL = "./jobs.json"; 

    const loadbtn = document.getElementById("loadbtn");
    const searchInput = document.getElementById("searchInput");
    const jobContainer = document.getElementById("jobcontainer");

//handled loading, error and empty UI states.
function showLoading(){
  jobContainer.innerHTML = `<p class="text-center text-slate-100 col-span-full text-2xl mt-10">
      Loading Jobs ⏳
    </p>`;
}
function showError(){
  jobContainer.innerHTML = `
    <p class="text-center text-red-500 col-span-full text-2xl mt-10">
      Something went wrong ❌
    </p>
  `;
}
function showEmpty(){
  jobContainer.innerHTML = `
    <p class="col-span-full text-center text-red-600 text-2xl mt-10">
      No jobs found ⚠️ Please click Load Jobs first
    </p>
  `;
}

let jobData = [];
let isLoaded = false;
let selectedJob = null;

/* ---------- FETCH JOBS ---------- */
const fetchJobs = async() =>{
 if(isLoaded){
    loadbtn.innerText = "Jobs Loaded";
    loadbtn.classList.add("opacity-60", "cursor-not-allowed");
    return;
 }

 showLoading();
 loadbtn.disabled = true;  //again active button, user can able to click the button 

 try{
    let response = await fetch(API_URL);
    let data = await response.json();
    jobData = data;
    isLoaded = true;
    renderJobs(jobData);
}catch(error){
    showError();
    loadbtn.disabled = false;   //disabled Button ko inactive / grey bana deta hai-- job data loaded so avoid double click
}
};


/* ---------- SALARY FILTER ---------- */
const salaryFilter = document.getElementById("salaryFilter")
function filterBysalary(range, data){
  if(!range) return data; // if not select salary filter then show All salaries

  let min=0;
  let max = Infinity;

  if(range.includes("+")){
    min = Number(range.replace("+", ""));     //Number(50000+)-> 50000
  }else{
    [min, max] = range.split("-").map(Number);    //range= "50000-80000" .map(Number)-> [50000, 80000]
  }
  return data.filter(job =>{
    return job.salary >= min && job.salary <= max;    //75000>=50000 && 75000<=80000
  });
}
/* ---------- SEARCH + SALARY COMBINE ---------- */
function applyFilters() {
  if (!isLoaded) {
    fetchJobs().then(() => applyFilters());
    return;
  }

  const keyword = searchInput.value.trim().toLowerCase();
  const salaryRange = salaryFilter.value;

  let filteredJobs = [...jobData];

  filteredJobs = filterJobsByKeyword(keyword, filteredJobs);
  filteredJobs = filterBysalary(salaryRange, filteredJobs);

  filteredJobs.length ? renderJobs(filteredJobs) : showEmpty();
}

/* ---------- RENDER JOBS ---------- */
function renderJobs(data){
  jobContainer.innerHTML = "";
    if(!data.length){
        showEmpty();
        return;
    }
    data.forEach(job => {
        const alreadyApplied = isJobApplied(job);
        const card = document.createElement("div");
        card.classList.add("job-card");
card.className = `
      bg-white rounded-xl p-4 shadow-md
      flex flex-col h-full m-3
      hover:shadow-xl hover:scale-[1.02]
      transition duration-300
    `;
 card.innerHTML = `
<!-- Logo -->
      <div class="flex justify-center mb-2">
        <div class="w-16 h-16 flex items-center justify-center border rounded-md">
          <img 
            src="./Images/${job.logo}" 
            alt="${job.company}"
            class="w-full h-full object-contain p-1"/>
        </div>
      </div>
<!-- Company & Role -->
  <div class="">
        <h3 class="text-lg font-semibold text-gray-800">
          ${job.company}
        </h3>
        <p class="text-sm text-gray-500">
          ${job.position}
        </p>
      </div>
<!-- Job Details -->
      <div class="text-sm text-slate-700 space-y-1 flex-grow">
        <p><strong>Salary:</strong> ${job.salary}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Experience:</strong> ${job.experience}</p>
        <p><strong>Level:</strong> ${job.level}</p>
        <p class="text-xs text-gray-600">Posted: ${job.posted}</p>
      </div>
<!-- Apply Button -->
      <button class="apply-btn mt-4 w-full py-2 rounded-md font-semibold transition
        ${alreadyApplied ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                         : 'bg-indigo-600 text-white hover:bg-indigo-700'}"
        ${alreadyApplied ? 'disabled' : ''}>

        ${alreadyApplied ? 'Already Applied✔️' : 'Apply'}
      </button>
    `;
        const applyBtn = card.querySelector(".apply-btn");
        applyBtn.addEventListener("click", ()=>{
          if(isJobApplied(job)) return;
              selectedJob = job;   
              openModal(job);
              console.log("Apply clicked for:", job.name);
        })

        jobContainer.appendChild(card);
    });
}
/* ---------- Modal Open Function ---------- */
const modalJobText = document.getElementById("modalJobText");
function openModal(job) {
  modalJobText.innerText = `Apply for ${job.position} at ${job.company}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

const modal = document.getElementById("modal");
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal() 
});

/* ---------- Modal Close Function ---------- */
const closeModalBtn = document.getElementById("closeModal");
closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}
closeModalBtn.addEventListener("click", closeModal);

function getAppliedJobs(){
  return JSON.parse(localStorage.getItem("appliedJobs")) || [];
}

function saveApliedJobs(jobs){
  localStorage.setItem("appliedJobs", JSON.stringify(jobs));
}

const confirmApply = document.getElementById("confirmApply");
confirmApply.addEventListener("click", () => {
  if(!selectedJob) return;
  
  let appliedJobs = getAppliedJobs(); // stored in Array
  const alreadyApplied = appliedJobs.some(job => 
    job.company === selectedJob.company && job.position === selectedJob.position);

  if(alreadyApplied){
    alert("You have already applied for this job ✅");
    closeModal();
    return;
  }  
  
  appliedJobs.push({
    ...selectedJob, 
    appliedAt: new Date().toISOString()
  });

  saveApliedJobs(appliedJobs); //Updated list localStorage me save

  alert(`Successfully applied for ${selectedJob.position} at ${selectedJob.company}`);
  closeModal();
});

function isJobApplied(job){
  const appliedJobs = JSON.parse(localStorage.getItem("appliedJobs")) || [];
  return appliedJobs.some(applied => 
    applied.company === job.company && applied.position === job.position);
}

/* ---------- FILTER LOGIC ---------- */
function filterJobsByKeyword(keyword, data){    
    if(!keyword) return data;      
    return data.filter(job =>{
       return(job.position.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword)||
        job.role.toLowerCase().includes(keyword)||
        job.location.toLowerCase().includes(keyword)
    );
});
}

/* ---------- EVENTS ---------- */
loadbtn.addEventListener("click", fetchJobs);
searchInput.addEventListener("input", applyFilters);
salaryFilter.addEventListener("change", applyFilters);

