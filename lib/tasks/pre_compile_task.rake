require 'zip/zip'
require 'erb'
namespace  :socialbyway do 
	desc "packaging socialbyway"

	#execution: rake socialbyway:build[true,"1.1.0","/home/site"] 
	#socialbyway1.1.0 is the name of the folder that we want to package in
	task :build, [:jsdocs_flag, :version_number, :site_destination_path] => :environment do |t,args|

		
		dir_name = "socialbyway"
		version = ""
		docs_flag = args[:jsdocs_flag].blank? ?  true :  (args[:jsdocs_flag] == "true")
		if !args[:version_number].blank?
			dir_name = dir_name + args[:version_number]
			version = ".#{args[:version_number]}"
		end			

		inner_folder = "default"

		structure = ['js', 'docs', 'style', 'tmp']
		final_folders = ['js', 'docs', 'style', 'callback', 'config', 'proxy', 'demo']
		server_assets = ['callback', 'config', 'demo', 'proxy']
		js_files = ['socialbyway', 'socialbyway.ui']
		js_folders = ['socialbyway', 'socialbyway-ui']
		stylesheets = ['socialbyway.ui']

		assets_path =  Rails.root.to_s + "/public/assets"
		root_dir = Rails.root.to_s + "/build/#{dir_name}"
		build_path = Rails.root.to_s + "/build"
		app_path =  Rails.root.to_s + "/app"
		callbacks = Rails.root.to_s + "/serverAssets"
	
		site_path =  args[:site_destination_path].blank? ? (Rails.root.to_s + "/site") : args[:site_destination_path].gsub(/\/$/,"")		
		puts site_path
		jsdoc_path =  Rails.root.to_s + "/lib/jsdoc3"
		zip_path = Rails.root.to_s + "/build"
		jsdoc_readme = Rails.root.to_s + "/app/assets/javascripts"

		if File.exists?(Rails.root.to_s+"/build")
			FileUtils.rm_rf Rails.root.to_s+"/build"
		end

		#creating root directory
		FileUtils.mkdir_p(root_dir)
		puts "created Folder at " + root_dir

		#creating inner directories
		structure.each do |name|
		  
		  if(name == "style")
		  	FileUtils.mkdir_p(root_dir + "/#{name}")
		  	FileUtils.mkdir_p(root_dir + "/#{name}/#{inner_folder}/images")
		  elsif name == "docs"
		  	if(docs_flag == true)
			  	FileUtils.mkdir_p(root_dir + "/#{name}")
			  	js_files.each do |file|
			  		FileUtils.mkdir_p(root_dir + "/#{name}/#{file}/")
			  	end
		   end
		  else
		     FileUtils.mkdir_p(root_dir + "/#{name}")	 		   
		  end
		end


		if File.exists? (assets_path)
		 FileUtils.rm_rf assets_path
		end

		# precompiling in dev mode, gives compiled and concatenated version
		`rake assets:precompile RAILS_ENV=development`

		copy_files(js_files, assets_path, root_dir, "js","js", "", "", version)
		copy_files(stylesheets, assets_path+"/#{inner_folder}", root_dir, "css","style",  "", "#{inner_folder}", version)

	
		if File.exists? (assets_path)
		 FileUtils.rm_rf assets_path
		end

		# precompiling in productuion mode, gives compiled , concatenated  and minified version	

		`rake assets:precompile`
		copy_files(js_files, assets_path, root_dir, "js","js", ".min", "", version)
		copy_files(stylesheets, assets_path+"/#{inner_folder}", root_dir, "css" ,"style", ".min", "#{inner_folder}", version)
		FileUtils.rm_rf root_dir+"/tmp"

		puts "copied images directory"	
		
		FileUtils.cp_r Dir[app_path+"/assets/images/#{inner_folder}/*"], root_dir + "/style/#{inner_folder}/images"

		puts "copied callbacks directory"


		FileUtils.cp_r Dir[callbacks+"/*"], root_dir +"/"

		#creating docs
		if (docs_flag == true)
			js_files.each_with_index do |file, i|
				puts "running #{jsdoc_path}/jsdoc #{root_dir}/js/#{file}.js -d #{root_dir}/docs/#{file}/"
				`#{jsdoc_path}/jsdoc  #{root_dir}/js/#{file}.js -d #{root_dir}/docs/#{file}/ #{jsdoc_readme}/#{js_folders[i]}/readme.md`
			end

	    end
		
		process_demo_files(root_dir + "/demo", version)

		#creating the zip file
		archive = File.join(zip_path+"/", dir_name)+'.zip'
  		FileUtils.rm archive, :force=>true

  		Zip::ZipFile.open(archive, 'w') do |zipfile|
    		Dir["#{zip_path}/**/**"].reject{|f|f==archive}.each do |file|    			
      		zipfile.add(file.sub(zip_path+'/',''),file)
    		end
  		end

  		#copying the zip file to the folder and removing the zip parallel to the folder
		FileUtils.cp_r archive , root_dir+"/"
		FileUtils.rm_rf archive

		final_folders.each do |fname| 
			
			puts "copying #{root_dir}/#{fname} to site folder"
			if(File.exists? "#{root_dir}/#{fname}" )
				FileUtils.cp_r "#{root_dir}/#{fname}/", "#{site_path}/"
				FileUtils.rm_rf "#{root_dir}/#{fname}/"
			end
		end

		if File.exists? (site_path + "/build/#{dir_name}")			
			FileUtils.rm_rf site_path + "/build/#{dir_name}"
		end
		FileUtils.cp_r build_path+"/", site_path+"/"
		FileUtils.rm_rf build_path+"/"


	end

	def copy_files(files, assets_path, root_dir, fileext, folder_name, ext, folder, version)
		files.each do |name|			
		 FileUtils.cp_r assets_path + "/#{name}.#{fileext}" , root_dir + "/tmp/"
		 File.rename root_dir + "/tmp/#{name}.#{fileext}" , root_dir + "/tmp/#{name}#{version}#{ext}.#{fileext}"
		 FileUtils.cp_r root_dir + "/tmp/#{name}#{version}#{ext}.#{fileext}" , root_dir + "/#{folder_name}/#{folder}/"
	   end		
	end
	
	def process_demo_files(folder_name, version)
		Dir.entries(folder_name).each do |file|
			if !File.directory?("#{file}")			
			  convert_to_html(folder_name, file, version)
			 end
		end
	end	

	def convert_to_html(path, file_name, version)
		@sbwminjs = "socialbyway#{version}.min.js"
		@sbwuiminjs = "socialbyway.ui#{version}.min.js"
		@sbwjs = "socialbyway#{version}.js"
		@sbwuijs = "socialbyway.ui#{version}.js"
		@sbwuimincss="socialbyway.ui#{version}.min.css"
		@sbwuicss="socialbyway.ui#{version}.css"


		all_lines = ""
		file = File.new("#{path}/#{file_name}" ,"r")

		while (line = file.gets)
			all_lines<< "#{line}"
		end
		file.close
		dest_file = file_name.sub(".erb", "")
		
		renderer = ERB.new(all_lines)
		opfile = File.new("#{path}/#{dest_file}" ,"w")
		opfile.write(renderer.result())
		opfile.close()
		FileUtils.rm_rf file
	end

end
	